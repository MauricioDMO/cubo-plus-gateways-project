import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";

import Carousel from "@/components/organisms/Carousel";
import HomeSearchBar from "@/components/organisms/HomeSearchBar";
import PostCard from "@/components/molecules/PostCard";
import { AmenityIcon } from "@/components/atoms/icons";
import { mediaPublicUrl } from "@/shared/media/media";
import { buildListingSummary } from "@/modules/listings/amenities";
import { attrValue } from "@/modules/bookings/booking-quote";
import { listingTown } from "@/modules/listings/locations";
import { listingBuilding } from "@/modules/listings/listing-buildings";
import JsonLd from "@/components/seo/JsonLd";
import { businessSchema } from "@/shared/seo/structured-data";
import type { CSSProperties } from "react";
import { CATEGORY_COVER_WP_IDS, type HomeData } from "@/modules/site/server/home";
import {
  ALL_SLOTS,
  applyTokens,
  categoryImageSlotId,
  focusProps,
  lookProps,
  placeImageSlotId,
  slotMediaId,
  slotText,
  type TokenValues,
} from "@/modules/content/site-content";
import {
  buildConciergeHref,
  CONCIERGE_SERVICE_DETAILS,
  CONCIERGE_SERVICE_GROUPS,
  CONCIERGE_SERVICE_LABELS,
} from "@/modules/concierge/concierge-shared";

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

export default function HomeTemplate({ data }: { data: HomeData }) {
  const { content, posts, listings, heroUrl, ctaUrl, orderedCategories, destinations, towns,
    stayPhrase, townPhrase, showCategories, placeCards, placeHeading, placeSubtitle,
    chosenUrlById, coverUrlByWpId, conciergeUrl, placePhotoById, maxGuests } = data;
  const chosenUrl = (slotId: string) => {
    const id = slotMediaId(content, slotId);
    return id != null ? chosenUrlById.get(id) : undefined;
  };

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
            <Image
              src={conciergeUrl}
              fill
              sizes="(max-width: 860px) 100vw, 50vw"
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
                      <Image
                        src={mediaPublicUrl(listing.featured_media.storage_path)}
                        fill
                        sizes="(max-width: 640px) 85vw, (max-width: 960px) 50vw, 33vw"
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
      {/* Cards are components/molecules/PostCard (Task 30), the exact same card the
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
