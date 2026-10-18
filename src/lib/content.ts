import { hasPublicSupabaseConfig, publicSupabaseClient } from "./supabase";
import { listingFallbackMedia, type MediaRef } from "./media";
import { isListingActive } from "./listing-visibility";
import { parseSiteContent, SITE_CONTENT_SLUG, type SiteContent } from "./site-content";

/*
 * Deactivated properties are dropped here, in JS, rather than with a
 * PostgREST filter on `attributes->>active`.
 *
 * The reason is that "off" is not one value: the flag can read false, 0, no
 * or off, and only lib/listing-visibility.ts knows that. Expressing it in
 * five query strings would be five chances for one of them to disagree, and
 * the one that disagrees is the one that leaks a property the owner took
 * down. The catalogue is ten rows; the filter is free.
 */
function onlyActive<T extends { attributes?: unknown }>(listings: T[]): T[] {
  return listings.filter((listing) => isListingActive(listing.attributes as Record<string, unknown> | null));
}

/*
 * Public page lookup. The `status` filter is the whole point of the
 * publish/draft/private control in the admin: without it a page saved as a
 * draft was still served in full at its own URL, and deleting was the only
 * way to take something down.
 */
export async function getPageBySlug(slug: string) {
  if (!hasPublicSupabaseConfig()) return null;
  const supabase = publicSupabaseClient();
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "publish")
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch page "${slug}": ${error.message}`, { cause: error });
  }
  return data;
}

/**
 * True when year/month/day are a real calendar date in the shape a blog URL
 * uses. The segments come straight from the URL, so without this check any
 * four-segment path -- a typo, a stale link, a crawler probing /a/b/c/d --
 * was interpolated into a timestamp literal and sent to Postgres, which
 * rejected it with a 22007 the route then turned into a 500. Bad URLs must
 * be a 404.
 */
export function isBlogDatePath(year: string, month: string, day: string): boolean {
  if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month) || !/^\d{2}$/.test(day)) return false;
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  // Rejects the days that do not exist in that month -- Date rolls 2026-02-31
  // forward to March rather than failing, so compare the parts back.
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() + 1 === Number(month) &&
    date.getUTCDate() === Number(day)
  );
}

/*
 * Posts carry a status, and only "published" is public.
 *
 * Nothing filtered on it before, which was fine only because nothing could
 * create anything else -- every save was a publish. Now that the publish rules
 * make a draft the way to keep unfinished work, an unfiltered query would put
 * every draft straight on the site. Exactly the bug getPageBySlug had.
 */
const PUBLISHED = "published";

export async function getPostBySlugAndDate(year: string, month: string, day: string, slug: string) {
  if (!hasPublicSupabaseConfig()) return null;
  if (!isBlogDatePath(year, month, day)) return null;
  const supabase = publicSupabaseClient();
  const dayStart = `${year}-${month}-${day}T00:00:00Z`;
  const dayEnd = `${year}-${month}-${day}T23:59:59Z`;
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", PUBLISHED)
    .eq("slug", slug)
    .gte("published_at", dayStart)
    .lte("published_at", dayEnd)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch post "${slug}": ${error.message}`, { cause: error });
  }
  return data;
}

export async function getListingBySlug(slug: string) {
  if (!hasPublicSupabaseConfig()) return null;
  const supabase = publicSupabaseClient();
  const { data, error } = await supabase.from("listings").select("*").eq("slug", slug).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch listing "${slug}": ${error.message}`, { cause: error });
  }
  // A deactivated property is a 404, not a hidden-from-the-grid page. Leaving
  // its permalink live means a guest holding the link -- from WhatsApp, from
  // a Google result that has not been recrawled -- can still open it and
  // request dates on a property that is off the market.
  if (!isListingActive(data.attributes)) return null;
  const [withPets] = await attachListingTaxonomies([data]);
  return withPets;
}

export async function getMediaByIds(ids: number[]) {
  if (!hasPublicSupabaseConfig()) return [];
  const supabase = publicSupabaseClient();
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("media").select("id, storage_path, alt_text").in("id", ids);
  if (error) {
    throw new Error(`Failed to fetch media by ids: ${error.message}`, { cause: error });
  }
  return data ?? [];
}

async function attachListingFeaturedMedia<
  T extends { featured_media_id: number | null; slug: string; title: string },
>(listings: T[]) {
  const featuredMediaIds = listings
    .map((l) => l.featured_media_id)
    .filter((id): id is number => id != null);
  const media = await getMediaByIds(featuredMediaIds);
  const mediaById = new Map(media.map((m) => [m.id, m]));

  return listings.map((listing) => {
    const attachedMedia =
      listing.featured_media_id != null ? (mediaById.get(listing.featured_media_id) ?? null) : null;
    const fallbackMedia = listingFallbackMedia(listing.slug);
    return {
      ...listing,
      featured_media: attachedMedia ?? fallbackMedia,
    };
  }) as Array<T & { featured_media: MediaRef | null }>;
}

// Shared by getAllPosts, getPostsByCategory, and getRecentPosts (Task 30):
// resolves each post's featured thumbnail and category label the way every
// post card on the real site shows them (photo + one category badge),
// confirmed via devtools on getawayselsalvador.com to be the exact same
// `.post--archive` card partial on /blog, /category/<slug>, and the
// homepage's "From the Blog" section alike. Pulled into one helper so the
// fan-out-through-post_terms-then-media join lives in exactly one place
// instead of three near-identical copies.
//
// post_terms carries both `category` and `post_tag` relations (real posts
// carry ~7 tags each), so the term lookup is filtered to `taxonomy =
// "category"` -- otherwise a post's tags would flood its card's single
// category slot.
async function attachPostCardData<T extends { id: number; featured_media_id: number | null }>(posts: T[]) {
  if (posts.length === 0) return [];
  const supabase = publicSupabaseClient();

  const { data: relations, error: relationsError } = await supabase
    .from("post_terms")
    .select("post_id, term_id")
    .in(
      "post_id",
      posts.map((p) => p.id)
    );
  if (relationsError) {
    throw new Error(`Failed to fetch post categories: ${relationsError.message}`, { cause: relationsError });
  }

  const termIds = [...new Set((relations ?? []).map((r) => r.term_id))];
  let categoryTermsById = new Map<number, { id: number; name: string; slug: string }>();
  if (termIds.length > 0) {
    const { data: terms, error: termsError } = await supabase
      .from("terms")
      .select("id, name, slug")
      .eq("taxonomy", "category")
      .in("id", termIds);
    if (termsError) {
      throw new Error(`Failed to fetch post category terms: ${termsError.message}`, { cause: termsError });
    }
    categoryTermsById = new Map((terms ?? []).map((t) => [t.id, t]));
  }

  const categoriesByPostId = new Map<number, Array<{ id: number; name: string; slug: string }>>();
  for (const { post_id, term_id } of relations ?? []) {
    const term = categoryTermsById.get(term_id);
    if (!term) continue;
    const existing = categoriesByPostId.get(post_id);
    if (existing) existing.push(term);
    else categoriesByPostId.set(post_id, [term]);
  }

  const media = await getMediaByIds(posts.map((p) => p.featured_media_id).filter((id): id is number => id != null));
  const mediaById = new Map(media.map((m) => [m.id, m]));

  return posts.map((p) => ({
    ...p,
    featured_media: p.featured_media_id != null ? (mediaById.get(p.featured_media_id) ?? null) : null,
    categories: categoriesByPostId.get(p.id) ?? [],
  }));
}

// The /blog index's cards show a thumbnail and category badge alongside
// title/date (Task 30), matching the real site's `.post--archive` card and
// the homepage's "From the Blog" teasers below, so each post is enriched with
// `featured_media`/`categories` via the same attachPostCardData helper.
/**
 * The journal's categories, with how many published posts each holds.
 *
 * Derived from the posts rather than queried on its own: attachPostCardData
 * already carries each post's terms, so this costs nothing extra and, more to
 * the point, can never list a category that has no posts behind it or miss one
 * that does. The footer used to name these in hard-coded markup, which meant
 * renaming a category in the admin left the old name in the footer forever.
 *
 * Ordered by count, then name, so the busiest reads first.
 */
export async function getPostCategoriesWithCounts() {
  const posts = await getAllPosts();
  const byslug = new Map<string, { name: string; slug: string; count: number }>();
  for (const post of posts) {
    for (const category of post.categories ?? []) {
      const existing = byslug.get(category.slug);
      if (existing) existing.count += 1;
      else byslug.set(category.slug, { name: category.name, slug: category.slug, count: 1 });
    }
  }
  return [...byslug.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getAllPosts() {
  if (!hasPublicSupabaseConfig()) return [];
  const supabase = publicSupabaseClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", PUBLISHED)
    .order("published_at", { ascending: false });
  if (error) {
    throw new Error(`Failed to fetch all posts: ${error.message}`, { cause: error });
  }
  return attachPostCardData(data ?? []);
}

// Same as getMediaByIds but keyed by the ORIGINAL WordPress attachment id.
// Needed because a couple of images are referenced by wp_id rather than by a
// foreign key: the homepage's two `wp:cover` blocks name their background
// photo as `"id":285` / `"id":287` inside their own stored block attributes,
// and HivePress's listing-category photos live in `hp_image` term meta that
// this migration never extracted. Returning `wp_id` lets callers index the
// result by the id they already hold.
export async function getMediaByWpIds(wpIds: number[]) {
  if (!hasPublicSupabaseConfig()) return [];
  const supabase = publicSupabaseClient();
  if (wpIds.length === 0) return [];
  const { data, error } = await supabase
    .from("media")
    .select("id, wp_id, storage_path, alt_text")
    .in("wp_id", wpIds);
  if (error) {
    throw new Error(`Failed to fetch media by wp_ids: ${error.message}`, { cause: error });
  }
  return data ?? [];
}

// The /properties index cards show a thumbnail alongside title/price (Task
// 26), matching the Related Listings section on the listing detail page, so
// featured media is resolved here the same way getRelatedListings does:
// fetch the listings, then fetch their featured media by id and attach it as
// `featured_media` (storage_path/alt_text, or null when there's no featured
// photo) rather than duplicating a Storage-URL lookup.
export async function getAllListings() {
  if (!hasPublicSupabaseConfig()) return [];
  const supabase = publicSupabaseClient();
  const { data, error } = await supabase.from("listings").select("*").order("title");
  if (error) {
    throw new Error(`Failed to fetch all listings: ${error.message}`, { cause: error });
  }
  const listings = onlyActive(data ?? []);
  if (listings.length === 0) return [];

  return attachListingFeaturedMedia(listings);
}

export async function getListingCategoryWithListings(slug: string) {
  if (!hasPublicSupabaseConfig()) return null;
  const supabase = publicSupabaseClient();
  const { data: term, error: termError } = await supabase
    .from("terms")
    .select("*")
    .eq("taxonomy", "hp_listing_category")
    .eq("slug", slug)
    .single();
  if (termError) {
    if (termError.code === "PGRST116") return null;
    throw new Error(`Failed to fetch listing category "${slug}": ${termError.message}`, { cause: termError });
  }

  const { data: relations, error: relationsError } = await supabase
    .from("listing_terms")
    .select("listing_id")
    .eq("term_id", term.id);
  if (relationsError) {
    throw new Error(`Failed to fetch listing category relations for "${slug}": ${relationsError.message}`, {
      cause: relationsError,
    });
  }
  const listingIds = (relations ?? []).map((r) => r.listing_id);

  const { data: listings, error: listingsError } = await supabase
    .from("listings")
    .select("*")
    .in("id", listingIds);
  if (listingsError) {
    throw new Error(`Failed to fetch listings for category "${slug}": ${listingsError.message}`, {
      cause: listingsError,
    });
  }
  const categoryListings = onlyActive(listings ?? []);
  const withTaxonomies = await attachListingTaxonomies(categoryListings);
  return {
    term,
    listings: await attachListingFeaturedMedia(withTaxonomies),
  };
}

// Blog category archives (Task 27): /category/<slug>, WordPress's default
// category archive URL, which the real footer's "Blog" widget links to
// ("Getaways Guides", "Uncategorized").
//
// Same shape as getListingCategoryWithListings above -- term lookup, then a
// fan-out through the join table -- with two deliberate differences:
//
//   * post_terms carries BOTH `category` and `post_tag` relations (real posts
//     carry ~7 tags each), so the term lookup is pinned to
//     `taxonomy = "category"`. Without that, a tag slug would resolve as if it
//     were a category.
//   * A term that exists with zero posts returns `{ term, posts: [] }`, not
//     null. Only a slug with no matching term at all returns null (-> 404).
//     `uncategorized` is exactly this case: the live footer lists it and it has
//     no posts, so the page has to render an empty state rather than a 404.
//
// /category/<slug> reuses /blog's cards verbatim (components/PostCard.tsx,
// Task 30), so posts are enriched with featured_media/categories via
// attachPostCardData the same way getAllPosts is.
export async function getPostsByCategory(slug: string) {
  if (!hasPublicSupabaseConfig()) return null;
  const supabase = publicSupabaseClient();
  const { data: term, error: termError } = await supabase
    .from("terms")
    .select("*")
    .eq("taxonomy", "category")
    .eq("slug", slug)
    .single();
  if (termError) {
    if (termError.code === "PGRST116") return null;
    throw new Error(`Failed to fetch category "${slug}": ${termError.message}`, { cause: termError });
  }

  const { data: relations, error: relationsError } = await supabase
    .from("post_terms")
    .select("post_id")
    .eq("term_id", term.id);
  if (relationsError) {
    throw new Error(`Failed to fetch category relations for "${slug}": ${relationsError.message}`, {
      cause: relationsError,
    });
  }
  const postIds = (relations ?? []).map((r) => r.post_id);
  if (postIds.length === 0) return { term, posts: [] };

  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("*")
    .eq("status", PUBLISHED)
    .in("id", postIds)
    .order("published_at", { ascending: false });
  if (postsError) {
    throw new Error(`Failed to fetch posts for category "${slug}": ${postsError.message}`, {
      cause: postsError,
    });
  }
  return { term, posts: await attachPostCardData(posts ?? []) };
}

// Related Listings (Task 24): listings that share at least one
// hp_listing_category term with the given listing, excluding the listing
// itself. listing_terms only ever stores hp_listing_category relations (see
// extract/seed_supabase.py), so no taxonomy filter is needed here -- unlike
// getListingCategoryWithListings, which starts from a term *slug* rather
// than a listing id, this starts from the listing and fans out through its
// own category memberships instead of one fixed category.
//
// The real site's related-listing cards (and its /properties-equivalent
// grids) show a thumbnail alongside title/price, so each returned listing
// carries a resolved `featured_media` (storage_path/alt_text, or null when
// there's no featured photo) -- fetched with the same getMediaByIds used for
// the main listing gallery, rather than duplicating a Storage-URL lookup.
//
// `.order("title").limit(limit)` is applied at the query level (matching
// getAllListings' own ordering convention) so which listings surface is a
// stable, explicit choice rather than incidental Postgres row order.
export async function getRelatedListings(listingId: number, limit = 4) {
  if (!hasPublicSupabaseConfig()) return [];
  const supabase = publicSupabaseClient();
  const { data: ownTerms, error: ownTermsError } = await supabase
    .from("listing_terms")
    .select("term_id")
    .eq("listing_id", listingId);
  if (ownTermsError) {
    throw new Error(`Failed to fetch categories for listing ${listingId}: ${ownTermsError.message}`, {
      cause: ownTermsError,
    });
  }
  const termIds = (ownTerms ?? []).map((r) => r.term_id);
  if (termIds.length === 0) return [];

  const { data: sharedRelations, error: sharedError } = await supabase
    .from("listing_terms")
    .select("listing_id")
    .in("term_id", termIds)
    .neq("listing_id", listingId);
  if (sharedError) {
    throw new Error(`Failed to fetch related listings for listing ${listingId}: ${sharedError.message}`, {
      cause: sharedError,
    });
  }
  const relatedIds = [...new Set((sharedRelations ?? []).map((r) => r.listing_id))];
  if (relatedIds.length === 0) return [];

  const { data: listings, error: listingsError } = await supabase
    .from("listings")
    .select("*")
    .in("id", relatedIds)
    .order("title")
    .limit(limit);
  if (listingsError) {
    throw new Error(`Failed to fetch related listings by id: ${listingsError.message}`, {
      cause: listingsError,
    });
  }
  const relatedListings = onlyActive(listings ?? []);
  const withTaxonomies = await attachListingTaxonomies(relatedListings);
  return attachListingFeaturedMedia(withTaxonomies);
}

// ---------------------------------------------------------------------------
// Homepage sections (Task 25)
//
// The WP homepage builds these three sections from HivePress blocks that store
// no HTML (`<!-- wp:hivepress/... /-->` self-closing markers rendered by PHP at
// page-view time), so they have to be rebuilt as real queries. All three follow
// the fan-out-then-join-in-JS shape already used by getRelatedListings /
// getListingCategoryWithListings rather than PostgREST embedded resources,
// keeping every query in this file the same shape.
// ---------------------------------------------------------------------------

// Powers the "Top Categories" cards, which show a per-category listing count
// ("1 Listing" / "9 Listings") next to the category name. listing_terms is tiny
// (one row per listing/category pair), so the counts are tallied in JS instead
// of issuing a count query per category.
export async function getListingCategoriesWithCounts() {
  if (!hasPublicSupabaseConfig()) return [];
  const supabase = publicSupabaseClient();
  const { data: terms, error: termsError } = await supabase
    .from("terms")
    .select("*")
    .eq("taxonomy", "hp_listing_category");
  if (termsError) {
    throw new Error(`Failed to fetch listing categories: ${termsError.message}`, { cause: termsError });
  }

  const { data: relations, error: relationsError } = await supabase
    .from("listing_terms")
    .select("term_id, listing_id");
  if (relationsError) {
    throw new Error(`Failed to fetch listing category counts: ${relationsError.message}`, {
      cause: relationsError,
    });
  }

  // Deactivated properties must not be counted, or a category emptied by
  // taking its last property down still advertises "Villas 1" in the sidebar
  // and links to a page with nothing on it.
  const { data: listingRows, error: listingsError } = await supabase.from("listings").select("id, attributes");
  if (listingsError) {
    throw new Error(`Failed to fetch listings for category counts: ${listingsError.message}`, {
      cause: listingsError,
    });
  }
  const activeIds = new Set(onlyActive(listingRows ?? []).map((row) => row.id));

  const countByTermId = new Map<number, number>();
  for (const { term_id, listing_id } of relations ?? []) {
    if (!activeIds.has(listing_id)) continue;
    countByTermId.set(term_id, (countByTermId.get(term_id) ?? 0) + 1);
  }

  return (terms ?? []).map((term) => ({
    ...term,
    listing_count: countByTermId.get(term.id) ?? 0,
  }));
}

// Powers the /properties sidebar's "Pets" select (Allowed / Cats Only / Dogs
// Only / Not Allowed) -- the real terms from the hp_listing_pets taxonomy,
// not a hardcoded option list, so a term renamed or added in WordPress shows
// up here after the next reseed without a code change.
export async function getPetsTerms() {
  if (!hasPublicSupabaseConfig()) return [];
  const supabase = publicSupabaseClient();
  const { data, error } = await supabase.from("terms").select("id, name, slug").eq("taxonomy", "hp_listing_pets");
  if (error) {
    throw new Error(`Failed to fetch pets terms: ${error.message}`, { cause: error });
  }
  return data ?? [];
}

// The live site orders its category cards/sidebar Villas-then-Apartments,
// which is neither alphabetical nor by listing count -- it comes from a
// manual term sort order (HivePress term meta) never extracted by this
// migration. Restated explicitly here so every page listing categories
// (home, /properties, /listing-category/<slug>) agrees; any future category
// not in this list sorts after these two, alphabetically.
const LISTING_CATEGORY_ORDER = ["villas-for-rent-in-surf-city", "apartments"];

export function orderListingCategories<T extends { slug: string; name: string }>(categories: T[]): T[] {
  return [...categories].sort((a, b) => {
    const rank = (slug: string) => {
      const i = LISTING_CATEGORY_ORDER.indexOf(slug);
      return i < 0 ? LISTING_CATEGORY_ORDER.length : i;
    };
    return rank(a.slug) - rank(b.slug) || a.name.localeCompare(b.name);
  });
}

/**
 * The categories worth showing: ordered, and with the empty ones dropped.
 *
 * A category with no live property is a dead end -- a nav item, a footer link
 * and a sidebar radio that all lead to a page reading "No properties match".
 * Taking the last property in a category down should take the category down
 * with it, and putting one back should bring it back, without a code change.
 */
export function visibleListingCategories<T extends { slug: string; name: string; listing_count: number }>(
  categories: T[]
): T[] {
  return orderListingCategories(categories.filter((category) => category.listing_count > 0));
}

type ListingTaxonomies = {
  categories: Array<{ id: number; name: string; slug: string }>;
  pets: string | null;
  petsSlug: string | null;
};

// Shared by getListingsForArchive (and, indirectly, getFeaturedListings),
// getListingCategoryWithListings, and getListingBySlug: resolves each
// listing's category term(s) and its single pets term (Allowed / Cats Only /
// Dogs Only / Not Allowed) from the same `listing_terms` join table.
//
// `listing_terms` has no taxonomy column of its own -- category and pets
// relations for a listing live side by side as plain (listing_id, term_id)
// rows (see extract/seed_supabase.py) -- so this fetches every related term
// once and splits them by `terms.taxonomy` itself, rather than issuing one
// query per taxonomy.
async function attachListingTaxonomies<T extends { id: number }>(
  listings: T[]
): Promise<Array<T & ListingTaxonomies>> {
  if (listings.length === 0) return listings as Array<T & ListingTaxonomies>;
  const supabase = publicSupabaseClient();

  const { data: relations, error: relationsError } = await supabase
    .from("listing_terms")
    .select("listing_id, term_id")
    .in(
      "listing_id",
      listings.map((l) => l.id)
    );
  if (relationsError) {
    throw new Error(`Failed to fetch listing categories: ${relationsError.message}`, { cause: relationsError });
  }

  const termIds = [...new Set((relations ?? []).map((r) => r.term_id))];
  let termsById = new Map<number, { id: number; name: string; slug: string; taxonomy: string }>();
  if (termIds.length > 0) {
    const { data: terms, error: termsError } = await supabase
      .from("terms")
      .select("id, name, slug, taxonomy")
      .in("id", termIds);
    if (termsError) {
      throw new Error(`Failed to fetch listing category terms: ${termsError.message}`, { cause: termsError });
    }
    termsById = new Map((terms ?? []).map((t) => [t.id, t]));
  }

  const categoriesByListingId = new Map<number, Array<{ id: number; name: string; slug: string }>>();
  const petsByListingId = new Map<number, { name: string; slug: string }>();
  for (const { listing_id, term_id } of relations ?? []) {
    const term = termsById.get(term_id);
    if (!term) continue;
    if (term.taxonomy === "hp_listing_category") {
      const existing = categoriesByListingId.get(listing_id);
      if (existing) existing.push(term);
      else categoriesByListingId.set(listing_id, [term]);
    } else if (term.taxonomy === "hp_listing_pets") {
      petsByListingId.set(listing_id, term);
    }
  }

  return listings.map((l) => ({
    ...l,
    categories: categoriesByListingId.get(l.id) ?? [],
    pets: petsByListingId.get(l.id)?.name ?? null,
    petsSlug: petsByListingId.get(l.id)?.slug ?? null,
  }));
}

// Powers the /properties archive's sidebar filter, sort, and pagination
// (all done in memory over this one array -- the live dataset is a couple
// dozen listings, so a dedicated filtered SQL query per facet would be
// premature complexity). Every listing comes back with its category
// memberships and featured photo attached, newest-created first (see the
// wp_id-as-date-proxy note on getFeaturedListings below).
export async function getListingsForArchive() {
  if (!hasPublicSupabaseConfig()) return [];
  const supabase = publicSupabaseClient();
  const { data: listings, error } = await supabase.from("listings").select("*").order("wp_id", { ascending: false });
  if (error) {
    throw new Error(`Failed to fetch listings for archive: ${error.message}`, { cause: error });
  }
  const rows = onlyActive(listings ?? []);
  if (rows.length === 0) return [];

  const withTaxonomies = await attachListingTaxonomies(rows);
  return attachListingFeaturedMedia(withTaxonomies);
}

// Powers the "Top Properties" cards -- the newest `limit` listings, with the
// same category/media enrichment getListingsForArchive already does, so this
// is just that list's first slice rather than a second query.
//
// This migration never extracted listing post_date, so "newest first" is
// approximated by `wp_id` descending -- WordPress assigns post ids in creation
// order, which reproduces the live site's first five cards in the exact same
// order. It is an approximation, not an equivalence: a listing whose post_date
// was backdated relative to its id can land in a different slot (on the live
// site the sixth card is Zonte Surfside; by id it is Zonte Sol). Ordering
// exactly would require adding a created-at column upstream in the Python
// extractor.
export async function getFeaturedListings(limit = 6) {
  const listings = await getListingsForArchive();
  return listings.slice(0, limit);
}

// Powers the "From the Blog" teasers: the newest posts with their thumbnail and
// category label resolved, matching the real site's post cards (photo, category
// label, title, date) via attachPostCardData -- the same helper getAllPosts and
// getPostsByCategory use, since all three sections render the same card.
export async function getRecentPosts(limit = 3) {
  if (!hasPublicSupabaseConfig()) return [];
  const supabase = publicSupabaseClient();
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("*")
    .eq("status", PUBLISHED)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (postsError) {
    throw new Error(`Failed to fetch recent posts: ${postsError.message}`, { cause: postsError });
  }
  return attachPostCardData(posts ?? []);
}

/**
 * A meta description derived from a page or post's own body.
 *
 * Every one of the nine blog posts carried no seo_description and no excerpt,
 * so all nine fell through to the same generic site blurb -- nine pages
 * telling Google they are about the same thing, which is how a blog competes
 * with itself. Taking the opening prose is not as good as a written summary,
 * but it is specific to the page, which is the whole job.
 *
 * Cuts on a word boundary rather than mid-word, and only after a sentence when
 * one ends near the limit, since a description clipped mid-clause reads as
 * broken text in a result.
 */
export function descriptionFromHtml(html: string | null | undefined, limit = 155): string | null {
  const text = (html ?? "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "\u2019")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

  if (text.length < 40) return null;
  if (text.length <= limit) return text;

  const window = text.slice(0, limit);
  const lastSentence = Math.max(window.lastIndexOf(". "), window.lastIndexOf("! "), window.lastIndexOf("? "));
  if (lastSentence > limit * 0.6) return window.slice(0, lastSentence + 1);

  const lastSpace = window.lastIndexOf(" ");
  return `${window.slice(0, lastSpace > 0 ? lastSpace : limit).trimEnd()}…`;
}

/*
 * The homepage's own photographs and copy.
 *
 * Read with the PUBLIC client, like every other public read in this file --
 * the service-role client exists for writes and for the admin, and reaching
 * for it on a page render would bypass RLS on every request to the front
 * page. The row is `draft`, so this is the one reader that deliberately does
 * not filter on status: getPageBySlug above returns published rows only,
 * which is what keeps /site-content itself a 404.
 *
 * Returns no overrides on any failure. The homepage falls back to the values
 * it shipped with, which is the difference between a stale photograph and a
 * front page that will not render.
 */
export async function getSiteContent(): Promise<SiteContent> {
  if (!hasPublicSupabaseConfig()) return {};
  const supabase = publicSupabaseClient();
  const { data, error } = await supabase
    .from("pages")
    .select("content_html")
    .eq("slug", SITE_CONTENT_SLUG)
    .maybeSingle();
  if (error || !data) return {};
  return parseSiteContent(data.content_html);
}
