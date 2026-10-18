import type { Metadata } from "next";
import Link from "next/link";
import {
  getFeaturedListings,
  getAllListings,
  getListingCategoriesWithCounts,
  getMediaByIds,
  getMediaByWpIds,
  getPageBySlug,
  getRecentPosts,
  getSiteContent,
  visibleListingCategories,
} from "@/lib/content";
import { ArrowRight, MapPin } from "lucide-react";

import Carousel from "@/components/Carousel";
import HomeSearchBar from "@/components/HomeSearchBar";
import PostCard from "@/components/PostCard";
import { AmenityIcon } from "@/components/icons";
import { mediaPublicUrl } from "@/lib/media";
import { buildListingSummary } from "@/lib/amenities";
import { attrValue } from "@/lib/booking-quote";
import { collectDestinations, listingTown, matchesDestination } from "@/lib/locations";
import { pickPhotoIdByRoom } from "@/lib/listing-gallery-groups";
import { groupByBuilding, listingBuilding } from "@/lib/listing-buildings";
import { slugify } from "@/lib/strings";
import JsonLd from "@/components/JsonLd";
import { businessSchema } from "@/lib/structured-data";
import type { CSSProperties } from "react";
import { getRenderState } from "@/lib/site-text";
import {
  ALL_SLOTS,
  applyTokens,
  categoryImageSlotId,
  focusProps,
  isAutoSlot,
  lookProps,
  placeImageSlotId,
  slotMediaId,
  slotText,
  type TokenValues,
} from "@/lib/site-content";
import {
  buildConciergeHref,
  CONCIERGE_SERVICE_DETAILS,
  CONCIERGE_SERVICE_GROUPS,
  CONCIERGE_SERVICE_LABELS,
} from "@/lib/concierge-shared";

/*
 * Homepage (Task 25).
 *
 * Unlike every other migrated page, the "home" page's stored `content_html`
 * cannot simply be rendered: 11 of its blocks are self-closing HivePress
 * markers (`<!-- wp:hivepress/listings ... /-->`) that carry no HTML at all,
 * because WordPress renders them from PHP at page-view time. So the static
 * copy is transcribed into JSX below (verbatim from the stored content_html,
 * in its stored order) and the dynamic blocks are rebuilt as real Supabase
 * queries. Section-by-section provenance:
 *
 *   1. hero h1/h2/button ............ static wp:columns + wp:buttons
 *   2. tagline h3 ................... static wp:heading
 *   3. Top Categories ............... static heading/subtitle
 *                                     + wp:hivepress/listing-categories (rebuilt)
 *   4. Get started .................. static wp:cover + 3x wp:hivepress/feature
 *                                     (the feature blocks' "01"/"02"/"03"
 *                                     captions live in the block attributes,
 *                                     so they are static enough to transcribe)
 *   5. Top Properties ............... static heading/subtitle
 *                                     + wp:hivepress/listings (rebuilt)
 *   6. From the Blog ................ static heading/subtitle
 *                                     + wp:hivepress/posts (rebuilt)
 *   7. Rent a Property / Become a Host ... static wp:cover
 *
 * Deliberately omitted, in stored order:
 *   - wp:hivepress/listing-tags (in the hero) and the "Meet Our Hosts"
 *     heading/subtitle/wp:hivepress/vendors group: all carry
 *     `"metadata":{"blockVisibility":false}`, i.e. the author hid them.
 *     Confirmed against the live site, which renders zero `.hp-vendor`
 *     elements -- so omitting them is exact fidelity, not a gap.
 *   - "What People Say" + wp:hivepress/testimonials: this one DOES render on
 *     the live site (3 testimonial cards), but no reviews/testimonials data
 *     was ever extracted by this migration. Its heading and subtitle are
 *     dropped along with it so the page doesn't show a headline over nothing.
 *
 * Known non-code gaps (upstream extractor work, out of scope here): listing
 * category descriptions and category photos (HivePress term meta), listing
 * post_date, the "Pets" taxonomy, and post authors/comment counts.
 */

// The `wp:cover` block behind "Rent a Property / Become a Host" names its
// background photo by WordPress attachment id in its own stored block
// attributes ("id":287). It was migrated, so it resolves to a real Storage URL
// at render time instead of hardcoding a storage path.
//
// Its sibling (id 285, the "get started" cover) was loaded and resolved here
// for a long time and never rendered -- one dead query on every homepage
// request. If that band comes back, the photo is media wp_id 285.
const CTA_COVER_WP_ID = 287; // 2021/10/image-36.png

// The hero photo is the one image here that is NOT referenced by the page's
// content_html: the live theme paints it on its own `.header-hero` element
// (site chrome) and renders the page's h1/h2/CTA on top of it. It is included
// with the hero it frames so the homepage reads like the real one; if page
// headers ever become shared chrome (layout.tsx), this is the piece to move.
const HERO_COVER_WP_ID = 447; // 2026/01/cropped-DJI_0151.jpg

// HivePress keeps each listing category's card photo in `hp_image` term meta,
// which this migration never extracted (terms carry only
// wp_id/taxonomy/name/slug). The photos themselves DID come across in the
// media table, so the live site's term -> attachment pairing is restated here
// by id. A category with no entry just renders a photo-less card.
const CATEGORY_COVER_WP_IDS: Record<string, number> = {
  "villas-for-rent-in-surf-city": 1198, // 2026/07/surf-city-villas-hd-v1.webp
  apartments: 1199, // 2026/07/apartment.webp
};

// Block attributes from the stored content_html, kept as the single source of
// truth for how many cards each rebuilt section shows:
//   wp:hivepress/listing-categories {"columns":"2","number":"2"}
//   wp:hivepress/listings           {"columns":"3","number":"6","slider":"1"}
//   wp:hivepress/posts              (no attrs; the live site renders 3)
const CATEGORY_COUNT = 2;
const LISTING_COUNT = 6;
const POST_COUNT = 3;

const nightlyRateFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatNightlyRate(price: string | undefined) {
  const value = Number(price?.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(value) || value <= 0) return "Book direct";
  return `${nightlyRateFormatter.format(value)} / night`;
}

// Capacity only — guests, bedrooms, baths — so this card reads the same as
// the ones on /properties and the listing page. It used to pad the line out
// to three items with amenities (Ocean view / Beach access / Pool), which
// made two cards with identical capacity look different and pushed the
// numbers a guest actually compares out of the line.
function buildFeaturedHighlights(attrs: Record<string, string>) {
  return buildListingSummary(attrs);
}

export async function generateMetadata(): Promise<Metadata> {
  const [page, content] = await Promise.all([getPageBySlug("home"), getSiteContent()]);

  /*
   * The share card follows the hero photograph.
   *
   * layout.tsx sets a site-wide og:image and calls it "the homepage hero" --
   * true when the hero was a constant, and a lie the moment somebody changes
   * it in the admin. Only the homepage overrides it here; every other page
   * keeps the layout default, which is still a photograph of the coast.
   */
  const heroId = slotMediaId(content, "home.hero.image");
  const [heroMedia] = heroId != null ? await getMediaByIds([heroId]) : [];
  // The fallbacks name the towns, because "Curated vacation rentals in El
  // Salvador" competes for nothing -- and the stored page title was the bare
  // word "Home", which is what the live site was serving as its <title>.
  return {
    title:
      page?.seo_title ||
      "Vacation Rentals in El Zonte, Surf City | Getaways El Salvador",
    description:
      page?.seo_description ||
      "Book oceanfront apartments direct in El Zonte, on El Salvador's Surf City coast. No booking fees, local team on the beach.",
    alternates: { canonical: "/" },
    ...(heroMedia
      ? {
          openGraph: {
            images: [{ url: mediaPublicUrl(heroMedia.storage_path), alt: "The coast at El Zonte, La Libertad" }],
          },
        }
      : {}),
  };
}

export default async function HomePage() {
  const { content } = await getRenderState();
  // No getPageBySlug("home")/notFound() in the body any more: the body is
  // built from the queries below, so a missing "pages" row would only affect
  // metadata (which already falls back) -- 404ing the entire site root over it
  // would be worse than rendering the sections that do have data.
  const [categories, listings, allListings, posts, coverMedia] = await Promise.all([
    getListingCategoriesWithCounts(),
    getFeaturedListings(LISTING_COUNT),
    getAllListings(),
    getRecentPosts(POST_COUNT),
    getMediaByWpIds([HERO_COVER_WP_ID, CTA_COVER_WP_ID, ...Object.values(CATEGORY_COVER_WP_IDS)]),
  ]);

  /*
   * The photographs, chosen in the admin, with these as the fallback.
   *
   * The WordPress ids below are what the page shipped with; a slot set on
   * /admin/site-content wins. Kept rather than replaced so an empty slot --
   * which is how "use the default" is stored -- still renders the photograph
   * that has always been there, and so the homepage does not depend on
   * somebody having visited the admin at least once.
   */
  const chosenMediaIds = [
    slotMediaId(content, "home.hero.image"),
    slotMediaId(content, "home.cta.image"),
    slotMediaId(content, "home.concierge.image"),
    ...Object.keys(CATEGORY_COVER_WP_IDS).map((slug) => slotMediaId(content, categoryImageSlotId(slug))),
    /*
     * The cards in "where you can stay" -- whichever tier is showing.
     *
     * Read for every possible key rather than only the ones on screen: the
     * tier changes with the catalogue (a second live category promotes the
     * category cards over the building ones), and an override set while
     * buildings were showing has to still be there when they come back.
     */
    ...Object.entries(content)
      .filter(([key]) => key.startsWith("home.place.") && key.endsWith(".image"))
      .map(([key]) => slotMediaId(content, key)),
  ].filter((id): id is number => id != null);
  const chosenMedia = chosenMediaIds.length > 0 ? await getMediaByIds(chosenMediaIds) : [];
  const chosenUrlById = new Map(chosenMedia.map((m) => [m.id, mediaPublicUrl(m.storage_path)]));
  const chosenUrl = (slotId: string) => {
    const id = slotMediaId(content, slotId);
    return id != null ? chosenUrlById.get(id) : undefined;
  };

  const coverUrlByWpId = new Map(coverMedia.map((m) => [m.wp_id, mediaPublicUrl(m.storage_path)]));
  const heroUrl = chosenUrl("home.hero.image") ?? coverUrlByWpId.get(HERO_COVER_WP_ID);
  const ctaUrl = chosenUrl("home.cta.image") ?? coverUrlByWpId.get(CTA_COVER_WP_ID);
  const orderedCategories = visibleListingCategories(categories).slice(0, CATEGORY_COUNT);

  // The search bar offers whatever towns the catalogue actually covers, and
  // caps its guest picker at the largest party any one property can sleep --
  // both read off the listings so neither needs maintaining by hand.
  const destinations = collectDestinations(allListings);
  /*
   * The towns and the kind of stay, both read off the catalogue.
   *
   * These were three hardcoded strings -- an eyebrow, a tagline, and a
   * subtitle -- all naming "El Zonte, Xanadu and Surf City" and "apartments
   * and villas". The day the Xanadu house was sold, all three became claims
   * the site could not back with a single bookable property, and Google reads
   * a promise with nothing behind it as thin. Derived, they cannot go stale.
   */
  const towns = destinations.map((destination) => destination.label.split(",")[0]?.trim()).filter(Boolean);
  const townPhrase =
    towns.length > 1 ? `${towns.slice(0, -1).join(", ")} and ${towns[towns.length - 1]}` : (towns[0] ?? "El Salvador");
  const stayPhrase =
    orderedCategories.length > 0
      ? orderedCategories.map((category) => category.name.toLowerCase()).join(" and ")
      : "vacation rentals";

  /*
   * What the second section shows: categories, towns, or buildings.
   *
   * It is a two-up grid, so it needs two cards to be worth a heading -- a
   * single card beside an empty half promises a choice there is nothing to
   * make. Each fallback is the next real choice down:
   *
   *   categories  Apartments and Villas, while both have properties in them.
   *   towns       El Zonte and Surf City, while both do. They have pages of
   *               their own that rank, and needed the internal links.
   *   buildings   Zonset Surf Residences and Barefoot Surf & Sand. With every
   *               apartment in El Zonte the town stopped being a choice, and
   *               the building is the one a guest actually makes -- which is
   *               why the archive groups by it.
   *
   * The rule is the count, not the calendar: a second category, or a property
   * in a second town, brings that tier back on its own.
   */
  const showCategories = orderedCategories.length >= 2;

  /*
   * A card photo comes from the photo tour tags, not from a listing cover.
   *
   * Covers are interiors -- a sofa, a kitchen -- because that is what sells a
   * unit. On a card that says "El Zonte" or "Barefoot Surf & Sand" a living
   * room says nothing about the place, so this prefers a photo somebody
   * tagged as the view, the neighbourhood, the pool or the terrace, and only
   * falls back to a cover when there is none. It is the first thing the room
   * tags pay for beyond the tour itself.
   */
  const PLACE_PHOTO_ROOMS = ["Views", "Neighbourhood", "Pool", "Terrace"];
  const pickPlacePhotoId = (inPlace: typeof allListings) => pickPhotoIdByRoom(inPlace, PLACE_PHOTO_ROOMS);

  type PlaceCard = { key: string; name: string; count: number; href: string; photoId: number | null; cover?: { storage_path: string; alt_text: string | null } | null };

  const townCards: PlaceCard[] = destinations.map((destination) => {
    const inTown = allListings.filter((listing) => matchesDestination(listing.attributes, destination.label));
    return {
      key: destination.slug,
      name: destination.label.split(",")[0]?.trim() ?? destination.label,
      count: destination.count,
      href: `/destinations/${destination.slug}`,
      photoId: pickPlacePhotoId(inTown),
      cover: inTown.find((listing) => listing.featured_media)?.featured_media,
    };
  });

  const buildingCards: PlaceCard[] = groupByBuilding(allListings)
    .filter((group) => group.building != null)
    .map((group) => ({
      key: slugify(group.building!),
      name: group.building!,
      count: group.listings.length,
      // The archive filters on ?building=, which is why that filter exists.
      href: `/properties?building=${slugify(group.building!)}`,
      photoId: pickPlacePhotoId(group.listings),
      cover: group.listings.find((listing) => listing.featured_media)?.featured_media,
    }));

  const placeCards = showCategories ? [] : townCards.length >= 2 ? townCards : buildingCards;
  const placeHeading = placeCards === buildingCards ? "Where you can stay" : "Where we are";
  const placeSubtitle =
    placeCards === buildingCards
      ? "Two oceanfront buildings in El Zonte, a few minutes apart."
      : "Two stretches of the La Libertad coast, half an hour apart.";
  /*
   * A photograph for the concierge band.
   *
   * Excludes every photograph the place cards above it already use: both were
   * asking for "the first thing tagged Views" and both got the same palms, a
   * few hundred pixels apart. Terrace and Pool come first here too -- somewhere
   * you would be sitting, rather than the same wide view the cards show.
   */
  const usedPhotoIds = new Set(
    placeCards.flatMap((card) => (card.photoId != null ? [card.photoId] : []))
  );
  /*
   * The editable copy.
   *
   * `text(id)` returns what was set on /admin/site-content, else the default
   * the slot carries, with {stays} and {towns} filled in from the catalogue
   * either way -- so a sentence written in the admin cannot go stale the way
   * the three hardcoded ones did when the Xanadu house was sold.
   */
  const tokens: TokenValues = { stays: stayPhrase, towns: townPhrase };
  const slotById = new Map(ALL_SLOTS.map((slot) => [slot.id, slot]));
  /*
   * `derived` is the default the PAGE works out -- the towns it covers, the
   * heading that changes with which tier of cards is showing. The registry
   * cannot hold those, so the call site passes them and an override still
   * wins.
   */
  /** Marks one thing on the page as editable, when editing. */
  const edit = (
    id: string,
    label: string,
    kind: string = "text",
    { className }: { className?: string; [option: string]: unknown } = {}
  ) => {
    // How it looks (alignment, size) for everyone; the editing attributes
    // only while editing. The element's own class comes in through here so
    // the two merge.
    const look = kind === "image" ? { className, style: undefined } : lookProps(content, id, className);
    return {
      ...(look.className ? { className: look.className } : {}),
      ...(look.style ? { style: look.style as CSSProperties } : {}),
    };
  };
  /** Where a photo sits in its frame, on computers and phones, once somebody drags it. */
  const focus = (slotId: string, background: boolean, className?: string) => {
    const look = focusProps(content[`${slotId}@focus`], content[`${slotId}@focusMobile`], background, className);
    return { className: look.className, style: look.style as CSSProperties | undefined };
  };

  const text = (id: string, derived?: string) => {
    const set = content[id];
    if (set) return applyTokens(set, tokens);
    if (derived != null) return applyTokens(derived, tokens);
    const slot = slotById.get(id);
    return slot ? slotText(content, slot, tokens) : "";
  };

  const conciergePhotoId = pickPhotoIdByRoom(
    allListings,
    ["Terrace", "Pool", "Views", "Neighbourhood"],
    usedPhotoIds
  );
  const [autoConciergePhoto] = conciergePhotoId ? await getMediaByIds([conciergePhotoId]) : [];
  // A photograph chosen in the admin pins the section; otherwise it keeps
  // rotating with whatever terrace or pool shot the catalogue offers.
  const conciergeUrl =
    chosenUrl("home.concierge.image") ??
    (autoConciergePhoto ? mediaPublicUrl(autoConciergePhoto.storage_path) : undefined);

  const placePhotos = await getMediaByIds(placeCards.map((card) => card.photoId).filter((id): id is number => id != null));
  const placePhotoById = new Map(placePhotos.map((media) => [media.id, media]));

  const maxGuests = allListings.reduce((max, listing) => {
    const attrs = (listing.attributes as Record<string, string>) ?? {};
    const guests = Number.parseInt(attrs.guests ?? "", 10);
    return Number.isFinite(guests) && guests > max ? guests : max;
  }, 0);

  return (
    <div className="home">
      {/* The site emitted no structured data at all, so Google had to infer
          from prose where a business whose entire product is WHERE it is
          actually operates. Rendered once, here, and referenced by @id from
          every listing and destination page. */}
      <JsonLd data={businessSchema()} />

      {/* 1. Hero */}
      <section
        className={focus("home.hero.image", true, `home-hero${heroUrl ? " home-hero--has-image" : ""}`).className}
        style={heroUrl ? { backgroundImage: `url(${heroUrl})`, ...focus("home.hero.image", true).style } : undefined}
        {...edit("home.hero.image", "Hero photograph", "image", { background: true })}
      >
        {/* The hero used to read "Getaways Concierge / Book a complimentary
            call, and we'll build your stay" -- a lead-capture framing from
            when the site could not take a payment, so the only thing it could
            ask for was a phone call. The product is now direct booking: the
            search bar sits immediately below this, so the hero's job is to
            say what is on offer and get out of the way. Shorter copy is also
            what lets the photograph show on a phone, where the old four-line
            subtitle covered it almost entirely. */}
        <div className="home-hero__content">
          <p {...edit("home.hero.eyebrow", "Eyebrow", "text", { className: "home-hero__eyebrow" })}>
            {text("home.hero.eyebrow", towns.join(" · "))}
          </p>
          <h1 {...edit("home.hero.title", "Headline")}>{text("home.hero.title")}</h1>
          <h2 {...edit("home.hero.subtitle", "Subheadline")}>{text("home.hero.subtitle")}</h2>
          {/* The stored block sets its own colors --
              {"backgroundColor":"white","textColor":"black"} ->
              has-white-background-color has-black-color -- inverting the
              site's default dark pill so it reads over the photo. */}
          <div className="home-hero__actions">
            <Link
              href={text("home.hero.primaryHref")}
              {...edit("home.hero.primaryLabel", "First button", "link", {
                hrefSlot: "home.hero.primaryHref",
                className: "btn-cta btn-cta--on-photo",
              })}
            >
              {text("home.hero.primaryLabel")}
            </Link>
            <Link
              href={text("home.hero.secondaryHref")}
              {...edit("home.hero.secondaryLabel", "Second button", "link", {
                hrefSlot: "home.hero.secondaryHref",
                className: "btn-cta btn-cta--ghost-on-photo",
              })}
            >
              {text("home.hero.secondaryLabel")}
            </Link>
          </div>
        </div>
      </section>

      {destinations.length > 0 && <HomeSearchBar destinations={destinations} maxGuests={maxGuests} />}

      {/* 2. Tagline. Names all three towns: the eyebrow above promises El
          Zonte, Xanadu and Surf City, and a tagline naming only the first
          contradicted it -- and told Google the catalogue was smaller than it
          is. */}
      <h3 {...edit("home.tagline", "Tagline", "text", { className: "home-tagline" })}>{text("home.tagline")}</h3>

      {/* 3. Top Categories */}
      {/* Heading and subtitle are gated on the section having content, the
          same way the testimonials heading was dropped with its (unmigrated)
          data -- a headline over an empty band is worse than no section. */}
      {showCategories && (
        <section className="home-section">
          <h2 {...edit("home.categories.title", "Categories heading", "text", { className: "home-section__title" })}>
            {text("home.categories.title")}
          </h2>
          <p {...edit("home.categories.subtitle", "Categories subheading", "text", { className: "home-section__subtitle" })}>
            {text("home.categories.subtitle")}
          </p>
          <div className="category-grid">
            {orderedCategories.map((category) => {
              const imageWpId = CATEGORY_COVER_WP_IDS[category.slug];
              const imageUrl =
                chosenUrl(categoryImageSlotId(category.slug)) ??
                (imageWpId != null ? coverUrlByWpId.get(imageWpId) : undefined);
              return (
                <Link
                  key={category.id}
                  href={`/listing-category/${category.slug}`}
                  className={
                    focus(categoryImageSlotId(category.slug), true, `category-card${imageUrl ? " category-card--has-image" : ""}`)
                      .className
                  }
                  style={
                    imageUrl
                      ? { backgroundImage: `url(${imageUrl})`, ...focus(categoryImageSlotId(category.slug), true).style }
                      : undefined
                  }
                  {...edit(categoryImageSlotId(category.slug), category.name + " photo", "image", { background: true })}
                  // Without this the link's accessible name would be the whole
                  // card, "1 Listing Villas". The count stays visible text; it
                  // just isn't part of what the link announces.
                  aria-label={category.name}
                >
                  <span className="category-card__count">
                    {category.listing_count} {category.listing_count === 1 ? "Listing" : "Listings"}
                  </span>
                  <h3 className="category-card__name">{category.name}</h3>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 3b. Towns, or the buildings, when there is no choice of categories. */}
      {placeCards.length > 1 && (
        <section className="home-section">
          <h2 {...edit("home.places.title", "Where you can stay — heading", "text", { className: "home-section__title" })}>
            {text("home.places.title", placeHeading)}
          </h2>
          <p {...edit("home.places.subtitle", "Where you can stay — subheading", "text", { className: "home-section__subtitle" })}>
            {text("home.places.subtitle", placeSubtitle)}
          </p>
          <div className="category-grid">
            {placeCards.map((card) => {
              const autoPhoto = (card.photoId != null ? placePhotoById.get(card.photoId) : undefined) ?? card.cover;
              // A photograph chosen in the admin pins this card; otherwise it
              // keeps following whatever the room tags offer.
              const photoUrl =
                chosenUrl(placeImageSlotId(card.key)) ??
                (autoPhoto ? mediaPublicUrl(autoPhoto.storage_path) : undefined);
              return (
                <Link
                  key={card.key}
                  href={card.href}
                  className={focus(placeImageSlotId(card.key), true, `category-card${photoUrl ? " category-card--has-image" : ""}`).className}
                  style={photoUrl ? { backgroundImage: `url(${photoUrl})`, ...focus(placeImageSlotId(card.key), true).style } : undefined}
                  {...edit(placeImageSlotId(card.key), card.name + " photo", "image", { background: true })}
                  // Same reason as the category cards: without this the link
                  // announces itself as "6 stays El Zonte".
                  aria-label={card.name}
                >
                  <span className="category-card__count">
                    {card.count} {card.count === 1 ? "stay" : "stays"}
                  </span>
                  <h3 className="category-card__name">{card.name}</h3>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Concierge */}
      {/* Same section header as every other band on this page -- the short
          rule, the centred title, the one-line subtitle. It had its own
          left-aligned eyebrow-and-paragraph opening, which made one section
          out of six look like it came from a different site. */}
      <section className="home-concierge-section" aria-labelledby="home-concierge-title">
        <h2 id="home-concierge-title" {...edit("home.concierge.title", "Concierge heading", "text", { className: "home-section__title" })}>
          {text("home.concierge.title")}
        </h2>
        <p {...edit("home.concierge.subtitle", "Concierge subheading", "text", { className: "home-section__subtitle" })}>
          {text("home.concierge.subtitle")}
        </p>

        <div className="home-concierge">
        {conciergeUrl && (
          <div className="home-concierge__media" {...edit("home.concierge.image", "Concierge photograph", "image")}>
            <img
              src={conciergeUrl}
              alt=""
              loading="lazy"
              {...focus("home.concierge.image", false)}
              /* Decorative: the heading beside it already says what this is,
                 and the photograph is here for the feeling, not the facts. */
              aria-hidden="true"
            />
          </div>
        )}

        <div className="home-concierge__text">
          <ul className="home-concierge__list">
            {CONCIERGE_SERVICE_GROUPS.map((group) => {
              const service = group.services[0];
              return (
              <li key={group.label}>
                <Link href={buildConciergeHref({ service })} className="home-concierge__service">
                  <span className="home-concierge__moment">{group.label}</span>
                  <span>
                    <span className="home-concierge__label">{CONCIERGE_SERVICE_LABELS[service]}</span>
                    <span className="home-concierge__detail">{CONCIERGE_SERVICE_DETAILS[service].description}</span>
                  </span>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </li>
              );
            })}
          </ul>

          <Link className="btn-cta home-concierge__cta" href={buildConciergeHref({ service: "plan_everything" })}>
            {/* The words in their own span: an editable element holds only
                its value, and the arrow is not part of it. */}
            <span {...edit("home.concierge.ctaLabel", "Concierge button")}>{text("home.concierge.ctaLabel")}</span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          </div>
        </div>
      </section>

      {/* 5. Top Properties */}
      {/* The live block (wp:hivepress/listings {"slider":"1"}) renders as a
          Slick carousel -- confirmed via devtools on getawayselsalvador.com
          as `.hp-listings--slider`, a single scrollable row with left/right
          arrows and a card peeking in at the edge. Carousel wraps this
          section's cards in a horizontally-scrollable row with its own
          arrow buttons; it is the only client component on this otherwise
          server-rendered page (Task 29). */}
      {listings.length > 0 && (
        <section className="home-section home-section--properties">
          <div className="home-section__header home-section__header--split">
            <div>
              <h2 {...edit("home.properties.title", "Properties heading", "text", { className: "home-section__title" })}>
                {text("home.properties.title")}
              </h2>
              <p {...edit("home.properties.subtitle", "Properties subheading", "text", { className: "home-section__subtitle" })}>
                {text("home.properties.subtitle")}
              </p>
            </div>
            <Link
              href={text("home.properties.linkHref")}
              {...edit("home.properties.linkLabel", "View all link", "link", {
                hrefSlot: "home.properties.linkHref",
                className: "home-section__link",
              })}
            >
              {text("home.properties.linkLabel")}
            </Link>
          </div>
          <Carousel trackClassName="property-grid" label="Top Properties">
            {listings.map((listing) => {
              const attrs = (listing.attributes as Record<string, string>) ?? {};
              const category = listing.categories[0];
              const highlights = buildFeaturedHighlights(attrs);
              const rate = formatNightlyRate(attrValue(attrs, "price"));
              /* The two things a card was still not answering: which
                 collection it belongs to and which town it is in. Both are on
                 the /properties card already, in these exact classes -- a card
                 that says different things on the homepage than on the archive
                 is two designs, not one. */
              const collection = listingBuilding(attrs);
              const town = listingTown(listing.attributes);
              return (
                <article key={listing.id} className="property-card">
                  {listing.featured_media && (
                    <Link href={`/listing/${listing.slug}`} className="property-card__media">
                      <img
                        src={mediaPublicUrl(listing.featured_media.storage_path)}
                        alt={listing.featured_media.alt_text || listing.title}
                        loading="lazy"
                      />
                      <span className="property-card__media-shade" aria-hidden="true" />
                      <span className="property-card__rate">{rate}</span>
                    </Link>
                  )}
                  <div className="property-card__body">
                    <div className="property-card__topline">
                      {category && (
                        <Link href={`/listing-category/${category.slug}`} className="property-card__category">
                          {category.name}
                        </Link>
                      )}
                    </div>
                    {collection && <p className="listing-card__collection">{collection}</p>}
                    <h3 className="property-card__title">
                      <Link href={`/listing/${listing.slug}`}>{listing.title}</Link>
                    </h3>
                    {town && (
                      <p className="listing-card__place">
                        <MapPin size={14} strokeWidth={2} aria-hidden="true" />
                        <span>{town}</span>
                      </p>
                    )}
                    {highlights.length > 0 && (
                      <ul className="property-card__highlights">
                        {highlights.map((item) => (
                          <li key={item.label}>
                            <AmenityIcon type={item.icon} className="listing-summary__icon" />
                            {item.value} {item.label}
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link
                      href={`/listing/${listing.slug}`}
                      {...edit("home.properties.cardCta", "Button on every property card", "text", {
                        className: "property-card__cta",
                      })}
                    >
                      {text("home.properties.cardCta")}
                    </Link>
                  </div>
                </article>
              );
            })}
          </Carousel>
        </section>
      )}

      {/* 6. From the Blog */}
      {/* Cards are components/PostCard (Task 30), the exact same card the
          /blog and /category/<slug> archives use -- confirmed via devtools
          that the live homepage's "From the Blog" section renders the
          identical `.post--archive` partial as those two pages. */}
      {posts.length > 0 && (
        <section className="home-section">
          <h2 {...edit("home.journal.title", "Journal heading", "text", { className: "home-section__title" })}>
            {text("home.journal.title")}
          </h2>
          <p {...edit("home.journal.subtitle", "Journal subheading", "text", { className: "home-section__subtitle" })}>
            {text("home.journal.subtitle")}
          </p>
          <div className="post-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* 7. Rent a Property / Become a Host */}
      <section
        className={focus("home.cta.image", true, `home-cover${ctaUrl ? " home-cover--has-image" : ""}`).className}
        style={ctaUrl ? { backgroundImage: `url(${ctaUrl})`, ...focus("home.cta.image", true).style } : undefined}
        {...edit("home.cta.image", "Band photograph", "image", { background: true })}
      >
        <div className="cta-grid">
          <div className="cta-column">
            <h2 {...edit("home.cta.leftTitle", "Left heading")}>{text("home.cta.leftTitle")}</h2>
            <Link
              href={text("home.cta.leftHref")}
              {...edit("home.cta.leftLabel", "Left button", "link", { hrefSlot: "home.cta.leftHref", className: "btn-cta" })}
            >
              {text("home.cta.leftLabel")}
            </Link>
          </div>
          <div className="cta-column">
            <h2 {...edit("home.cta.rightTitle", "Right heading")}>{text("home.cta.rightTitle")}</h2>
            {/* The live button points at /submit-listing, a HivePress
                submit-a-listing flow that this read-only migration has no
                equivalent for, so it points at the contact page instead. */}
            <Link
              href={text("home.cta.rightHref")}
              {...edit("home.cta.rightLabel", "Right button", "link", {
                hrefSlot: "home.cta.rightHref",
                className: "btn-cta btn-cta--secondary",
              })}
            >
              {text("home.cta.rightLabel")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
