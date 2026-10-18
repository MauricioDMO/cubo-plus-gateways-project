import "server-only";

import { hasPublicSupabaseConfig, publicSupabaseClient } from "@/infrastructure/data/local-client";
import { getMediaByIds } from "@/shared/media/server/media";
import { listingFallbackMedia, type MediaRef } from "@/shared/media/media";
import { isListingActive } from "@/modules/listings/listing-visibility";

// All catalogue reads share the same visibility rules, including direct permalinks.
function onlyActive<T extends { attributes?: unknown }>(listings: T[]): T[] {
  return listings.filter((listing) => isListingActive(listing.attributes as Record<string, unknown> | null));
}

export async function getListingBySlug(slug: string) {
  if (!hasPublicSupabaseConfig()) return null;
  const supabase = publicSupabaseClient();
  const { data, error } = await supabase.from("listings").select("*").eq("slug", slug).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch listing "${slug}": ${error.message}`, { cause: error });
  }
  if (!isListingActive(data.attributes)) return null;
  const [withPets] = await attachListingTaxonomies([data]);
  return withPets;
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

// Fan out through category relations; preserve title ordering before applying the limit.
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
  // A category with no active property must not advertise a stay.
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

export async function getPetsTerms() {
  if (!hasPublicSupabaseConfig()) return [];
  const supabase = publicSupabaseClient();
  const { data, error } = await supabase.from("terms").select("id, name, slug").eq("taxonomy", "hp_listing_pets");
  if (error) {
    throw new Error(`Failed to fetch pets terms: ${error.message}`, { cause: error });
  }
  return data ?? [];
}

type ListingTaxonomies = {
  categories: Array<{ id: number; name: string; slug: string }>;
  pets: string | null;
  petsSlug: string | null;
};

// Category and pet relations share listing_terms, so fetch once and split by taxonomy.
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

// Preserve the migration's wp_id approximation of newest-first; no post_date was extracted.
export async function getFeaturedListings(limit = 6) {
  const listings = await getListingsForArchive();
  return listings.slice(0, limit);
}
