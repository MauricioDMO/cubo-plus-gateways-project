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
        className={focus("home.hero.image", true, `relative grid grid-cols-1 items-end min-h-[clamp(470px,_54dvh,_560px)] w-[calc(100vw_-_48px)]
          pt-[clamp(40px,_7vw,_72px)] pr-[clamp(40px,_5vw,_72px)] pb-[clamp(52px,_7vw,_86px)] pl-[clamp(96px,_25vw,_520px)] mt-0
          mb-10 bg-button-bg overflow-hidden shadow-[0_28px_70px_rgba(15,_23,_39,_0.16)] isolate
          [animation:hero-rise_900ms_cubic-bezier(0.16,_1,_0.3,_1)_both] mx-[calc(50%_-_50vw_+_24px)] rounded-[8px]
          [&::before]:content-[''] [&::before]:absolute [&::before]:top-0 [&::before]:right-0 [&::before]:bottom-0
          [&::before]:left-0
          [&::before]:[background:radial-gradient(circle_at_72%_28%,_rgba(255,_193,_7,_0.12),_transparent_32%),_linear-gradient(90deg,_rgba(15,_23,_39,_0.8),_rgba(15,_23,_39,_0.38)_48%,_rgba(15,_23,_39,_0.2)),_linear-gradient(0deg,_rgba(15,_23,_39,_0.68),_rgba(15,_23,_39,_0.02)_58%)]
          [&::before]:z-[-1] [&_h1]:text-[rgb(250,_251,_249)] [&_h2]:text-[rgb(250,_251,_249)] [&_h2]:text-[30px]
          [&_h2]:leading-[37.5px] [&_h2]:mt-0 [&_h2]:mb-6 [&_h2]:mx-0 max-[1024.001px]:min-h-135
          max-[1024.001px]:pl-[clamp(48px,_14vw,_140px)] max-[768.001px]:min-h-115 max-[768.001px]:w-[calc(100vw_-_32px)]
          max-[768.001px]:pt-7 max-[768.001px]:pb-7.5 max-[768.001px]:items-end max-[768.001px]:mx-[calc(50%_-_50vw_+_16px)]
          max-[768.001px]:px-5.5
          [&::before]:max-[768.001px]:[background:linear-gradient(0deg,_rgba(15,_23,_39,_0.86),_rgba(15,_23,_39,_0.5)_42%,_rgba(15,_23,_39,_0.12)_74%)]
          [&_h1]:max-[768.001px]:text-[clamp(30px,_8.5vw,_40px)] [&_h1]:max-[768.001px]:leading-[1.1]
          [&_h2]:max-[768.001px]:text-[17px] [&_h2]:max-[768.001px]:leading-[1.45] [&_h2]:max-[768.001px]:mb-5
          motion-reduce:animate-none ${heroUrl ? ` [&&]:bg-center [&&]:bg-cover [&&]:bg-no-repeat
          [&&]:[animation:hero-rise_900ms_cubic-bezier(0.16,_1,_0.3,_1)_both,_hero-drift_18s_cubic-bezier(0.16,_1,_0.3,_1)_700ms_both]
          [&&]:max-[768.001px]:bg-cover [&&]:max-[768.001px]:[animation:hero-rise_900ms_cubic-bezier(0.16,_1,_0.3,_1)_both]
          [&&]:motion-reduce:animate-none` : ""}`).className}
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
        <div className="relative w-[min(700px,_100%)] max-w-full [animation:hero-copy-in_760ms_cubic-bezier(0.16,_1,_0.3,_1)_180ms_both]
          max-[768.001px]:max-w-full motion-reduce:animate-none">
          <p {...edit("home.hero.eyebrow", "Eyebrow", "text", { className: "mt-0 mb-3 text-[rgba(250,_251,_249,_0.76)] text-[12px] font-extrabold tracking-[0.1em] leading-none uppercase mx-0 max-[768.001px]:text-[rgb(250,_251,_249)]" })}>
            {text("home.hero.eyebrow", towns.join(" · "))}
          </p>
          <h1 {...edit("home.hero.title", "Headline")}>{text("home.hero.title")}</h1>
          <h2 {...edit("home.hero.subtitle", "Subheadline")}>{text("home.hero.subtitle")}</h2>
          {/* The stored block sets its own colors --
              {"backgroundColor":"white","textColor":"black"} ->
              has-white-background-color has-black-color -- inverting the
              site's default dark pill so it reads over the photo. */}
          <div className="home-hero__actions flex flex-wrap [animation:hero-copy-in_760ms_cubic-bezier(0.16,_1,_0.3,_1)_320ms_both] gap-3
            max-[768.001px]:gap-2.5 motion-reduce:animate-none">
            <Link
              href={text("home.hero.primaryHref")}
              {...edit("home.hero.primaryLabel", "First button", "link", {
                hrefSlot: "home.hero.primaryHref",
                className: String.raw`btn-cta inline-flex items-center justify-center bg-button-bg text-button-text font-body font-medium text-[16px]
                  no-underline whitespace-nowrap px-7 py-2.25 rounded-full [.home-hero\_\_actions_&]:max-[768.001px]:grow
                  [.home-hero\_\_actions_&]:max-[768.001px]:shrink [.home-hero\_\_actions_&]:max-[768.001px]:basis-[auto]
                  [.home-hero\_\_actions_&]:max-[768.001px]:min-h-11.5 [.home-hero\_\_actions_&]:max-[768.001px]:whitespace-nowrap
                  [.home-hero\_\_actions_&]:max-[768.001px]:px-4 [.cta-column_&]:self-center [.cta-column_&]:w-full
                  [.cta-column_&]:max-w-80 [.cta-column_&]:bg-[rgb(250,_251,_249)] [.cta-column_&]:text-button-bg [.cta-column_&]:px-7
                  [.cta-column_&]:py-3 [.cta-column_&]:border-0 [.cta-column+.cta-column_&]:bg-button-bg
                  [.cta-column+.cta-column_&]:text-button-text [&&]:bg-[rgb(250,_251,_249)] [&&]:text-[rgb(15,_23,_39)]
                  [&&]:shadow-[0_5px_21px_rgba(255,_255,_255,_0.35)]`,
              })}
            >
              {text("home.hero.primaryLabel")}
            </Link>
            <Link
              href={text("home.hero.secondaryHref")}
              {...edit("home.hero.secondaryLabel", "Second button", "link", {
                hrefSlot: "home.hero.secondaryHref",
                className: String.raw`btn-cta inline-flex items-center justify-center bg-button-bg text-button-text font-body font-medium text-[16px]
                  no-underline whitespace-nowrap px-7 py-2.25 rounded-full [.home-hero\_\_actions_&]:max-[768.001px]:grow
                  [.home-hero\_\_actions_&]:max-[768.001px]:shrink [.home-hero\_\_actions_&]:max-[768.001px]:basis-[auto]
                  [.home-hero\_\_actions_&]:max-[768.001px]:min-h-11.5 [.home-hero\_\_actions_&]:max-[768.001px]:whitespace-nowrap
                  [.home-hero\_\_actions_&]:max-[768.001px]:px-4 [.cta-column_&]:self-center [.cta-column_&]:w-full
                  [.cta-column_&]:max-w-80 [.cta-column_&]:bg-[rgb(250,_251,_249)] [.cta-column_&]:text-button-bg [.cta-column_&]:px-7
                  [.cta-column_&]:py-3 [.cta-column_&]:border-0 [.cta-column+.cta-column_&]:bg-button-bg
                  [.cta-column+.cta-column_&]:text-button-text [&&]:bg-[rgba(15,_23,_39,_0.16)] [&&]:text-[rgb(250,_251,_249)]
                  [&&]:[backdrop-filter:blur(2px)] [&&]:border [&&]:border-solid [&&]:border-[rgba(255,_255,_255,_0.72)]`,
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
      <h3 {...edit("home.tagline", "Tagline", "text", { className: "text-center text-[25px] leading-[31.25px] mt-8 mb-4 mx-0" })}>{text("home.tagline")}</h3>

      {/* 3. Top Categories */}
      {/* Heading and subtitle are gated on the section having content, the
          same way the testimonials heading was dropped with its (unmigrated)
          data -- a headline over an empty band is worse than no section. */}
      {showCategories && (
        <section className="mt-0 mb-14 mx-0">
          <h2 {...edit("home.categories.title", "Categories heading", "text", { className: String.raw`text-[42px] leading-[52.5px] text-center mt-8 mb-0 mx-0 [&::before]:content-[''] [&::before]:block [&::before]:w-6
            [&::before]:border-t-[2px] [&::before]:border-solid [&::before]:border-t-heading [&::before]:mt-0 [&::before]:mb-4
            [&::before]:mx-auto [.home-section\_\_header--split_&]:text-left [.home-section\_\_header--split_&]:mt-0
            [.home-section\_\_header--split_&::before]:ml-0 [.home-concierge-section_&]:text-white
            [.home-concierge-section_&::before]:border-t-[rgba(255,_255,_255,_0.55)]
            [.home-concierge-section_&]:max-[640.001px]:mt-0` })}>
            {text("home.categories.title")}
          </h2>
          <p {...edit("home.categories.subtitle", "Categories subheading", "text", { className: String.raw`text-center text-[20px] leading-[37.5px] text-muted-text mt-0 mb-10 mx-0 [.home-section\_\_header--split_&]:text-left
            [.home-section\_\_header--split_&]:mb-0 max-[768.001px]:text-[17px] max-[768.001px]:leading-[1.5] max-[768.001px]:mb-7
            [.home-concierge-section_&]:text-[rgba(255,_255,_255,_0.74)] [.home-concierge-section_&]:max-[640.001px]:mb-8` })}>
            {text("home.categories.subtitle")}
          </p>
          <div className="grid grid-cols-2 gap-6 max-[640.001px]:grid-cols-1">
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
                    focus(categoryImageSlotId(category.slug), true, `relative flex items-end aspect-[1_/_1] overflow-hidden bg-button-bg p-5 rounded-[8px] ${imageUrl ? ` [&&]:bg-center [&&]:bg-cover [&&]:bg-no-repeat [&::after]:content-[''] [&::after]:absolute [&::after]:top-0
                      [&::after]:right-0 [&::after]:bottom-0 [&::after]:left-0
                      [&::after]:[background:linear-gradient(to_top,_rgba(15,_23,_39,_0.75),_rgba(15,_23,_39,_0)_60%),_linear-gradient(to_bottom,_rgba(15,_23,_39,_0.45),_rgba(15,_23,_39,_0)_34%)]` : ""}`)
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
                  <span className="absolute top-4 left-4 z-[1] bg-[rgba(255,_255,_255,_0.35)] text-white text-[11px] font-normal leading-[16.5px] uppercase
                    tracking-[1px] px-3 py-1.5 rounded-full">
                    {category.listing_count} {category.listing_count === 1 ? "Listing" : "Listings"}
                  </span>
                  <h3 className="relative z-[1] text-[25px] leading-[31.25px] text-white m-0">{category.name}</h3>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 3b. Towns, or the buildings, when there is no choice of categories. */}
      {placeCards.length > 1 && (
        <section className="mt-0 mb-14 mx-0">
          <h2 {...edit("home.places.title", "Where you can stay — heading", "text", { className: String.raw`text-[42px] leading-[52.5px] text-center mt-8 mb-0 mx-0 [&::before]:content-[''] [&::before]:block [&::before]:w-6
            [&::before]:border-t-[2px] [&::before]:border-solid [&::before]:border-t-heading [&::before]:mt-0 [&::before]:mb-4
            [&::before]:mx-auto [.home-section\_\_header--split_&]:text-left [.home-section\_\_header--split_&]:mt-0
            [.home-section\_\_header--split_&::before]:ml-0 [.home-concierge-section_&]:text-white
            [.home-concierge-section_&::before]:border-t-[rgba(255,_255,_255,_0.55)]
            [.home-concierge-section_&]:max-[640.001px]:mt-0` })}>
            {text("home.places.title", placeHeading)}
          </h2>
          <p {...edit("home.places.subtitle", "Where you can stay — subheading", "text", { className: String.raw`text-center text-[20px] leading-[37.5px] text-muted-text mt-0 mb-10 mx-0 [.home-section\_\_header--split_&]:text-left
            [.home-section\_\_header--split_&]:mb-0 max-[768.001px]:text-[17px] max-[768.001px]:leading-[1.5] max-[768.001px]:mb-7
            [.home-concierge-section_&]:text-[rgba(255,_255,_255,_0.74)] [.home-concierge-section_&]:max-[640.001px]:mb-8` })}>
            {text("home.places.subtitle", placeSubtitle)}
          </p>
          <div className="grid grid-cols-2 gap-6 max-[640.001px]:grid-cols-1">
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
                  className={focus(placeImageSlotId(card.key), true, `relative flex items-end aspect-[1_/_1] overflow-hidden bg-button-bg p-5 rounded-[8px] ${photoUrl ? ` [&&]:bg-center [&&]:bg-cover [&&]:bg-no-repeat [&::after]:content-[''] [&::after]:absolute [&::after]:top-0
                    [&::after]:right-0 [&::after]:bottom-0 [&::after]:left-0
                    [&::after]:[background:linear-gradient(to_top,_rgba(15,_23,_39,_0.75),_rgba(15,_23,_39,_0)_60%),_linear-gradient(to_bottom,_rgba(15,_23,_39,_0.45),_rgba(15,_23,_39,_0)_34%)]` : ""}`).className}
                  style={photoUrl ? { backgroundImage: `url(${photoUrl})`, ...focus(placeImageSlotId(card.key), true).style } : undefined}
                  {...edit(placeImageSlotId(card.key), card.name + " photo", "image", { background: true })}
                  // Same reason as the category cards: without this the link
                  // announces itself as "6 stays El Zonte".
                  aria-label={card.name}
                >
                  <span className="absolute top-4 left-4 z-[1] bg-[rgba(255,_255,_255,_0.35)] text-white text-[11px] font-normal leading-[16.5px] uppercase
                    tracking-[1px] px-3 py-1.5 rounded-full">
                    {card.count} {card.count === 1 ? "stay" : "stays"}
                  </span>
                  <h3 className="relative z-[1] text-[25px] leading-[31.25px] text-white m-0">{card.name}</h3>
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
      <section className="home-concierge-section mt-0 mb-[clamp(56px,_7vw,_88px)] pt-[clamp(44px,_5vw,_76px)] pb-[clamp(52px,_6vw,_84px)] bg-button-bg
        shadow-[0_0_0_100vmax_var(--color-button-bg)] [clip-path:inset(0_-100vmax)] text-white mx-0 px-0 max-[640.001px]:px-3.5
        max-[640.001px]:py-12" aria-labelledby="home-concierge-title">
        <h2 id="home-concierge-title" {...edit("home.concierge.title", "Concierge heading", "text", { className: String.raw`text-[42px] leading-[52.5px] text-center mt-8 mb-0 mx-0 [&::before]:content-[''] [&::before]:block [&::before]:w-6
          [&::before]:border-t-[2px] [&::before]:border-solid [&::before]:border-t-heading [&::before]:mt-0 [&::before]:mb-4
          [&::before]:mx-auto [.home-section\_\_header--split_&]:text-left [.home-section\_\_header--split_&]:mt-0
          [.home-section\_\_header--split_&::before]:ml-0 [.home-concierge-section_&]:text-white
          [.home-concierge-section_&::before]:border-t-[rgba(255,_255,_255,_0.55)]
          [.home-concierge-section_&]:max-[640.001px]:mt-0` })}>
          {text("home.concierge.title")}
        </h2>
        <p {...edit("home.concierge.subtitle", "Concierge subheading", "text", { className: String.raw`text-center text-[20px] leading-[37.5px] text-muted-text mt-0 mb-10 mx-0 [.home-section\_\_header--split_&]:text-left
          [.home-section\_\_header--split_&]:mb-0 max-[768.001px]:text-[17px] max-[768.001px]:leading-[1.5] max-[768.001px]:mb-7
          [.home-concierge-section_&]:text-[rgba(255,_255,_255,_0.74)] [.home-concierge-section_&]:max-[640.001px]:mb-8` })}>
          {text("home.concierge.subtitle")}
        </p>

        <div className="grid grid-cols-[minmax(0,_1fr)_minmax(0,_1fr)] items-stretch gap-[clamp(28px,_4vw,_64px)] max-[860.001px]:grid-cols-1">
        {conciergeUrl && (
          <div className="relative overflow-hidden min-h-[clamp(340px,_30vw,_440px)] rounded-[10px] [&_img]:block [&_img]:w-full [&_img]:h-full
            [&_img]:object-cover [&_img]:object-[center_60%] max-[860.001px]:min-h-0 max-[860.001px]:aspect-[16_/_10]" {...edit("home.concierge.image", "Concierge photograph", "image")}>
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

        <div className="self-center">
          <ul className="[.home-concierge-section_&]:border-[rgba(255,_255,_255,_0.2)] [.home-concierge-section_&_li]:border-[rgba(255,_255,_255,_0.2)] mt-0
            mb-[clamp(24px,_3vw,_32px)] list-none border-t border-solid border-t-border mx-0 p-0 [&_li]:border-b [&_li]:border-solid
            [&_li]:border-b-border">
            {CONCIERGE_SERVICE_GROUPS.map((group) => {
              const service = group.services[0];
              return (
              <li key={group.label}>
                <Link href={buildConciergeHref({ service })} className="[.home-concierge-section_&>svg]:text-[rgba(255,_255,_255,_0.58)] [.home-concierge-section_&:focus-visible]:[outline-color:#fff]
                  grid grid-cols-[88px_minmax(0,_1fr)_20px] items-center min-h-17 text-inherit no-underline px-0 py-2.5 gap-5
                  focus-visible:[outline:2px_solid_var(--color-heading)] focus-visible:outline-offset-[3px] [&>svg]:text-[#64736e]
                  [&>svg]:[transition:transform_0.15s_ease] [&:hover>svg]:[transform:translateX(3px)] [&>svg]:motion-reduce:transition-none
                  max-[860.001px]:grid-cols-[72px_minmax(0,_1fr)_18px] max-[860.001px]:gap-3.5">
                  <span className="[.home-concierge-section_&]:text-[rgba(255,_255,_255,_0.58)] text-[11px] font-extrabold tracking-[0.08em] uppercase text-[#64736e]">{group.label}</span>
                  <span>
                    <span className="[.home-concierge-section_&]:text-white block text-[16px] font-semibold text-heading">{CONCIERGE_SERVICE_LABELS[service]}</span>
                    <span className="[.home-concierge-section_&]:text-[rgba(255,_255,_255,_0.74)] block mt-0.5 text-[14px] text-body-text">{CONCIERGE_SERVICE_DETAILS[service].description}</span>
                  </span>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </li>
              );
            })}
          </ul>

          <Link className="btn-cta inline-flex items-center justify-center bg-button-bg text-button-text font-body font-medium text-[16px] no-underline
            whitespace-nowrap px-7 py-2.25 rounded-full [.home-hero\_\_actions_&]:max-[768.001px]:grow
            [.home-hero\_\_actions_&]:max-[768.001px]:shrink [.home-hero\_\_actions_&]:max-[768.001px]:basis-[auto]
            [.home-hero\_\_actions_&]:max-[768.001px]:min-h-11.5 [.home-hero\_\_actions_&]:max-[768.001px]:whitespace-nowrap
            [.home-hero\_\_actions_&]:max-[768.001px]:px-4 [.cta-column_&]:self-center [.cta-column_&]:w-full [.cta-column_&]:max-w-80
            [.cta-column_&]:bg-[rgb(250,_251,_249)] [.cta-column_&]:text-button-bg [.cta-column_&]:px-7 [.cta-column_&]:py-3
            [.cta-column_&]:border-0 [.cta-column+.cta-column_&]:bg-button-bg [.cta-column+.cta-column_&]:text-button-text
            [.home-concierge-section_&]:bg-white [.home-concierge-section_&]:text-button-bg min-h-12.5 text-[17px] font-semibold px-8 py-3.25
            gap-2.25 [&_svg]:[transition:transform_0.15s_ease] [&:hover_svg]:[transform:translateX(3px)] [&_svg]:motion-reduce:transition-none" href={buildConciergeHref({ service: "plan_everything" })}>
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
        <section className="mt-0 mb-14 mx-0 [&&]:mt-4.5 [&&]:overflow-hidden">
          <div className="home-section__header home-section__header--split [&&]:flex [&&]:items-end [&&]:justify-between [&&]:max-w-320 [&&]:mt-0 [&&]:mb-7
            [&&]:mx-auto [&&]:px-[clamp(20px,_4vw,_48px)] [&&]:py-0 [&&]:gap-6 [&&]:max-[960.001px]:items-start [&&]:max-[960.001px]:flex-col">
            <div>
              <h2 {...edit("home.properties.title", "Properties heading", "text", { className: String.raw`text-[42px] leading-[52.5px] text-center mt-8 mb-0 mx-0 [&::before]:content-[''] [&::before]:block [&::before]:w-6
                [&::before]:border-t-[2px] [&::before]:border-solid [&::before]:border-t-heading [&::before]:mt-0 [&::before]:mb-4
                [&::before]:mx-auto [.home-section\_\_header--split_&]:text-left [.home-section\_\_header--split_&]:mt-0
                [.home-section\_\_header--split_&::before]:ml-0 [.home-concierge-section_&]:text-white
                [.home-concierge-section_&::before]:border-t-[rgba(255,_255,_255,_0.55)]
                [.home-concierge-section_&]:max-[640.001px]:mt-0` })}>
                {text("home.properties.title")}
              </h2>
              <p {...edit("home.properties.subtitle", "Properties subheading", "text", { className: String.raw`text-center text-[20px] leading-[37.5px] text-muted-text mt-0 mb-10 mx-0 [.home-section\_\_header--split_&]:text-left
                [.home-section\_\_header--split_&]:mb-0 max-[768.001px]:text-[17px] max-[768.001px]:leading-[1.5] max-[768.001px]:mb-7
                [.home-concierge-section_&]:text-[rgba(255,_255,_255,_0.74)] [.home-concierge-section_&]:max-[640.001px]:mb-8` })}>
                {text("home.properties.subtitle")}
              </p>
            </div>
            <Link
              href={text("home.properties.linkHref")}
              {...edit("home.properties.linkLabel", "View all link", "link", {
                hrefSlot: "home.properties.linkHref",
                className: `inline-flex items-center justify-center min-h-11 text-heading text-[14px] font-extrabold whitespace-nowrap
                  [transition:transform_180ms_ease,_background-color_180ms_ease,_color_180ms_ease,_box-shadow_180ms_ease] px-4.5 py-0
                  rounded-full border border-solid border-[color-mix(in_oklch,_var(--color-heading)_16%,_transparent)]
                  hover:[transform:translateY(-2px)] hover:bg-heading hover:text-background
                  hover:shadow-[0_16px_34px_rgba(21,_29,_43,_0.16)]`,
              })}
            >
              {text("home.properties.linkLabel")}
            </Link>
          </div>
          <Carousel trackClassName="pt-1.5 pb-7 [scroll-padding-inline:clamp(20px,_4vw,_48px)] px-[clamp(20px,_4vw,_48px)] max-[640.001px]:pt-1 max-[640.001px]:pb-6
            max-[640.001px]:px-5" label="Top Properties">
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
                <article key={listing.id} className="property-card grow-0 shrink-0 basis-[clamp(304px,_26vw,_354px)] w-[clamp(304px,_26vw,_354px)] snap-start flex flex-col items-start
                  relative min-h-107.5 shadow-[0_16px_50px_rgba(16,_27,_41,_0.08)] overflow-hidden
                  bg-[color-mix(in_oklch,_var(--color-background)_96%,_var(--color-accent)_4%)]
                  [transition:transform_220ms_cubic-bezier(0.16,_1,_0.3,_1),_box-shadow_220ms_cubic-bezier(0.16,_1,_0.3,_1),_border-color_220ms_ease]
                  p-0 rounded-[10px] hover:[transform:translateY(-6px)] hover:shadow-[0_28px_70px_rgba(16,_27,_41,_0.14)]
                  hover:border-[color-mix(in_oklch,_var(--color-accent)_34%,_var(--color-border))] max-[960.001px]:basis-82.5 max-[960.001px]:w-82.5
                  max-[640.001px]:basis-[min(86vw,_340px)] max-[640.001px]:w-[min(86vw,_340px)] max-[640.001px]:min-h-102.5">
                  {listing.featured_media && (
                    <Link href={`/listing/${listing.slug}`} className="relative block w-full aspect-[1.45] overflow-hidden bg-[color-mix(in_oklch,_var(--color-heading)_8%,_var(--color-background))]
                      [&_img]:block [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:[transition:transform_650ms_cubic-bezier(0.16,_1,_0.3,_1)]
                      [.property-card:hover_&_img]:[transform:scale(1.055)]">
                      <Image
                        src={mediaPublicUrl(listing.featured_media.storage_path)}
                        fill
                        sizes="(max-width: 640px) 85vw, (max-width: 960px) 50vw, 33vw"
                        alt={listing.featured_media.alt_text || listing.title}
                        loading="lazy"
                      />
                      <span className="absolute top-[auto] right-0 bottom-0 left-0 h-[48%] [background:linear-gradient(to_top,_rgba(17,_24,_35,_0.66),_transparent)]
                        pointer-events-none" aria-hidden="true" />
                      <span className="absolute right-4 bottom-4 inline-flex items-center min-h-8.5 bg-[color-mix(in_oklch,_var(--color-background)_94%,_transparent)]
                        text-heading text-[13px] font-[850] shadow-[0_10px_24px_rgba(16,_27,_41,_0.16)] px-3 py-0 rounded-full">{rate}</span>
                    </Link>
                  )}
                  <div className="property-card__body flex flex-1 flex-col w-full pt-4.5 pb-5 px-5">
                    <div className="flex items-center justify-between min-h-6 gap-3">
                      {category && (
                        <Link href={`/listing-category/${category.slug}`} className="inline-flex items-center max-w-[calc(100%_-_32px)] min-h-6
                          bg-[color-mix(in_oklch,_var(--color-heading)_90%,_var(--color-accent)_10%)] text-button-text text-[10px] leading-none font-[850]
                          uppercase tracking-[0.02em] overflow-hidden text-ellipsis whitespace-nowrap px-2.25 py-0 rounded-full">
                          {category.name}
                        </Link>
                      )}
                    </div>
                    {collection && <p className="listing-card__collection mt-3.5 mb-0.5 text-[10.5px] font-extrabold tracking-[1px] uppercase text-muted-text mx-0">{collection}</p>}
                    <h3 className="[.property-card\_\_body_.listing-card\_\_collection+&]:mt-0 [display:-webkit-box] min-h-[calc(2_*_1.22em)] mt-3.5 mb-0
                      overflow-hidden text-[22px] leading-[1.22] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] mx-0 [&_a]:text-heading
                      max-[640.001px]:text-[20px]">
                      <Link href={`/listing/${listing.slug}`}>{listing.title}</Link>
                    </h3>
                    {town && (
                      <p className="flex items-center mt-1.5 mb-0 text-[13.5px] text-body-text mx-0 gap-1.25 [&_svg]:flex-none [&_svg]:text-current">
                        <MapPin size={14} strokeWidth={2} aria-hidden="true" />
                        <span>{town}</span>
                      </p>
                    )}
                    {highlights.length > 0 && (
                      <ul className="flex flex-wrap items-center mt-2 mb-3.5 list-none text-body-text text-[14px] leading-[20px] tabular-nums mx-0 p-0
                        [&_li]:inline-flex [&_li]:items-center [&_li]:whitespace-nowrap [&_li]:gap-1 [&_li+li::before]:content-['·']
                        [&_li+li::before]:text-muted-text [&_li+li::before]:mx-1.5 [&_li+li::before]:my-0 max-[640.001px]:grid max-[640.001px]:grid-cols-2
                        max-[640.001px]:gap-y-1 max-[640.001px]:gap-x-2.5 [&_li+li::before]:max-[640.001px]:content-[none]">
                        {highlights.map((item) => (
                          <li key={item.label}>
                            <AmenityIcon type={item.icon} className="grow-0 shrink-0 basis-4 w-4 h-4 text-muted-text" />
                            {item.value} {item.label}
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link
                      href={`/listing/${listing.slug}`}
                      {...edit("home.properties.cardCta", "Button on every property card", "text", {
                        className: `inline-flex items-center justify-center self-start min-h-10 mt-auto bg-accent text-heading text-[14px] font-[850]
                          [transition:transform_180ms_ease,_background-color_180ms_ease] px-4 py-0 rounded-full
                          hover:[transform:translateY(-1px)] hover:bg-heading hover:text-background`,
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
        <section className="mt-0 mb-14 mx-0">
          <h2 {...edit("home.journal.title", "Journal heading", "text", { className: String.raw`text-[42px] leading-[52.5px] text-center mt-8 mb-0 mx-0 [&::before]:content-[''] [&::before]:block [&::before]:w-6
            [&::before]:border-t-[2px] [&::before]:border-solid [&::before]:border-t-heading [&::before]:mt-0 [&::before]:mb-4
            [&::before]:mx-auto [.home-section\_\_header--split_&]:text-left [.home-section\_\_header--split_&]:mt-0
            [.home-section\_\_header--split_&::before]:ml-0 [.home-concierge-section_&]:text-white
            [.home-concierge-section_&::before]:border-t-[rgba(255,_255,_255,_0.55)]
            [.home-concierge-section_&]:max-[640.001px]:mt-0` })}>
            {text("home.journal.title")}
          </h2>
          <p {...edit("home.journal.subtitle", "Journal subheading", "text", { className: String.raw`text-center text-[20px] leading-[37.5px] text-muted-text mt-0 mb-10 mx-0 [.home-section\_\_header--split_&]:text-left
            [.home-section\_\_header--split_&]:mb-0 max-[768.001px]:text-[17px] max-[768.001px]:leading-[1.5] max-[768.001px]:mb-7
            [.home-concierge-section_&]:text-[rgba(255,_255,_255,_0.74)] [.home-concierge-section_&]:max-[640.001px]:mb-8` })}>
            {text("home.journal.subtitle")}
          </p>
          <div className="grid grid-cols-3 mx-0 my-6 gap-6 max-[960.001px]:grid-cols-2 max-[640.001px]:grid-cols-1">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* 7. Rent a Property / Become a Host */}
      <section
        className={focus("home.cta.image", true, `mt-0 mb-14 bg-transparent mx-0 p-6 rounded-[8px] max-[640.001px]:p-0 ${ctaUrl ? " [&&]:bg-center [&&]:bg-cover [&&]:bg-no-repeat" : ""}`).className}
        style={ctaUrl ? { backgroundImage: `url(${ctaUrl})`, ...focus("home.cta.image", true).style } : undefined}
        {...edit("home.cta.image", "Band photograph", "image", { background: true })}
      >
        <div className="grid grid-cols-2 px-0 py-6 gap-8 max-[640.001px]:grid-cols-1 max-[640.001px]:pt-2 max-[640.001px]:pb-0 max-[640.001px]:px-0
          max-[640.001px]:gap-3.5">
          <div className="cta-column flex flex-col items-center pt-[clamp(30px,_3vw,_40px)] pb-[clamp(32px,_3.2vw,_42px)] bg-button-bg
            text-[rgb(250,_251,_249)] px-[clamp(22px,_2.4vw,_32px)] gap-4.5 rounded-[14px] [.cta-column+&]:bg-[#f7f4ed]
            [.cta-column+&]:text-heading [.cta-column+&]:border [.cta-column+&]:border-solid [.cta-column+&]:border-[rgba(57,_67,_66,_0.12)]
            [&_h2]:text-[30px] [&_h2]:leading-[37.5px] [&_h2]:text-inherit [&_h2]:m-0 [&_h2]:max-[640.001px]:text-[27px]
            [&_h2]:max-[640.001px]:leading-[1.2]">
            <h2 {...edit("home.cta.leftTitle", "Left heading")}>{text("home.cta.leftTitle")}</h2>
            <Link
              href={text("home.cta.leftHref")}
              {...edit("home.cta.leftLabel", "Left button", "link", { hrefSlot: "home.cta.leftHref", className: String.raw`btn-cta inline-flex items-center justify-center bg-button-bg text-button-text font-body font-medium text-[16px]
                no-underline whitespace-nowrap px-7 py-2.25 rounded-full [.home-hero\_\_actions_&]:max-[768.001px]:grow
                [.home-hero\_\_actions_&]:max-[768.001px]:shrink [.home-hero\_\_actions_&]:max-[768.001px]:basis-[auto]
                [.home-hero\_\_actions_&]:max-[768.001px]:min-h-11.5 [.home-hero\_\_actions_&]:max-[768.001px]:whitespace-nowrap
                [.home-hero\_\_actions_&]:max-[768.001px]:px-4 [.cta-column_&]:self-center [.cta-column_&]:w-full
                [.cta-column_&]:max-w-80 [.cta-column_&]:bg-[rgb(250,_251,_249)] [.cta-column_&]:text-button-bg [.cta-column_&]:px-7
                [.cta-column_&]:py-3 [.cta-column_&]:border-0 [.cta-column+.cta-column_&]:bg-button-bg
                [.cta-column+.cta-column_&]:text-button-text` })}
            >
              {text("home.cta.leftLabel")}
            </Link>
          </div>
          <div className="cta-column flex flex-col items-center pt-[clamp(30px,_3vw,_40px)] pb-[clamp(32px,_3.2vw,_42px)] bg-button-bg
            text-[rgb(250,_251,_249)] px-[clamp(22px,_2.4vw,_32px)] gap-4.5 rounded-[14px] [.cta-column+&]:bg-[#f7f4ed]
            [.cta-column+&]:text-heading [.cta-column+&]:border [.cta-column+&]:border-solid [.cta-column+&]:border-[rgba(57,_67,_66,_0.12)]
            [&_h2]:text-[30px] [&_h2]:leading-[37.5px] [&_h2]:text-inherit [&_h2]:m-0 [&_h2]:max-[640.001px]:text-[27px]
            [&_h2]:max-[640.001px]:leading-[1.2]">
            <h2 {...edit("home.cta.rightTitle", "Right heading")}>{text("home.cta.rightTitle")}</h2>
            {/* The live button points at /submit-listing, a HivePress
                submit-a-listing flow that this read-only migration has no
                equivalent for, so it points at the contact page instead. */}
            <Link
              href={text("home.cta.rightHref")}
              {...edit("home.cta.rightLabel", "Right button", "link", {
                hrefSlot: "home.cta.rightHref",
                className: String.raw`btn-cta inline-flex items-center justify-center bg-button-bg text-button-text font-body font-medium text-[16px]
                  no-underline whitespace-nowrap px-7 py-2.25 rounded-full [.home-hero\_\_actions_&]:max-[768.001px]:grow
                  [.home-hero\_\_actions_&]:max-[768.001px]:shrink [.home-hero\_\_actions_&]:max-[768.001px]:basis-[auto]
                  [.home-hero\_\_actions_&]:max-[768.001px]:min-h-11.5 [.home-hero\_\_actions_&]:max-[768.001px]:whitespace-nowrap
                  [.home-hero\_\_actions_&]:max-[768.001px]:px-4 [.cta-column_&]:self-center [.cta-column_&]:w-full
                  [.cta-column_&]:max-w-80 [.cta-column_&]:bg-[rgb(250,_251,_249)] [.cta-column_&]:text-button-bg [.cta-column_&]:px-7
                  [.cta-column_&]:py-3 [.cta-column_&]:border-0 [.cta-column+.cta-column_&]:bg-button-bg
                  [.cta-column+.cta-column_&]:text-button-text [&&]:bg-transparent [&&]:text-button-bg [&&]:px-6.5 [&&]:py-1.75
                  [&&]:border-[2px] [&&]:border-solid [&&]:border-button-bg`,
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
