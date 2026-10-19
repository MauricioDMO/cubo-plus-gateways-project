import Link from "next/link";
import Image from "next/image";
import { mediaPublicUrl } from "@/shared/media/media";
import { buildListingSummary } from "@/modules/listings/amenities";
import type { ContentBlock } from "@/modules/listings/listing-content";
import type { ListingDetailData } from "@/modules/listings/server/detail";
import BookingWidget from "@/components/organisms/BookingWidget";
import PhotoTour from "@/components/organisms/PhotoTour";
import ListingReviews from "@/components/organisms/ListingReviews";
import ListingVideo from "@/components/molecules/ListingVideo";
import MobileBookBar from "@/components/organisms/MobileBookBar";
import { BookingDatesProvider } from "@/modules/bookings/providers/BookingDates";
import { AmenityIcon } from "@/components/atoms/icons";
import { destinationSlug } from "@/modules/listings/locations";
import { ChevronDown, LayoutGrid, MapPin } from "lucide-react";
import { listingBuilding } from "@/modules/listings/listing-buildings";

import JsonLd from "@/components/seo/JsonLd";
import ListingGallery from "@/components/organisms/ListingGallery";
import { breadcrumbSchema, listingSchema } from "@/shared/seo/structured-data";
import { attrValue } from "@/modules/bookings/booking-quote";
import { buildConciergeHref } from "@/modules/concierge/concierge-shared";

/** One parsed block of a listing description. Shared by the summary and the
    sections so both render identically. */
/*
 * The concierge offer, in one place because it appears twice on this page --
 * as a band under the photographs on a phone, and as a card beside the
 * booking form on a desktop. Two copies of the same words is how they drift.
 *
 * Written in the brand book's own concierge voice ("You pick the dates. We
 * handle the rest. From airport to itinerary.") and named for the service
 * rather than the action, because the service is the thing being sold. The
 * four things listed are the four groups the concierge form actually offers:
 * travel, food and drinks, adventure, sports.
 */
const CONCIERGE = {
  title: "Getaways Concierge",
  body: "You pick the dates. We build the rest from scratch around this property — transport, food, surf, day trips, or the whole itinerary.",
  action: "Build my stay",
};

function renderBlock(block: ContentBlock, key: number) {
  if (block.type === "list") {
    return (
      <ul key={key} className="mt-0 mb-4 list-none mx-0 p-0 [&_li]:relative [&_li]:pl-5 [&_li]:leading-[28px] [&_li::before]:content-[''] [&_li::before]:absolute
        [&_li::before]:left-1 [&_li::before]:top-3 [&_li::before]:w-1.25 [&_li::before]:h-1.25 [&_li::before]:bg-muted-text
        [&_li::before]:rounded-[50%]">
        {block.items.map((item, j) => (
          <li key={j}>{item}</li>
        ))}
      </ul>
    );
  }
  // A heading cannot reach here: groupListingSections consumes every one of
  // them into a section title.
  if (block.type === "heading") return <h3 key={key}>{block.text}</h3>;
  return <p key={key}>{block.text}</p>;
}

export default function ListingTemplate({ data }: { data: ListingDetailData }) {
  const { listing, attrs, displayGalleryMedia, listingReviews, tourGroups, tourPhotoCount,
    descriptionHtml, descriptionSections, amenityRows, nightlyRate, relatedListings, category, location, checkoutMode } = data;

  return (
    <BookingDatesProvider minNights={attrs.booking_min_length}>
    <article className="w-[min(100%_-_48px,_1280px)] mt-[clamp(38px,_5vw,_70px)] mb-21.5 mx-auto max-[960.001px]:w-[min(100%_-_32px,_760px)]
      max-[560.001px]:mt-7.5 max-[900.001px]:mb-0 max-[900.001px]:pb-21
      max-[640.001px]:w-full">
      {/* VacationRental, not a generic LocalBusiness: the specific type is the
          one carrying occupancy, bedrooms and amenities, which is what an
          accommodation result is built from. Every field is derived from the
          listing itself -- nothing here is invented. */}
      <JsonLd
        data={listingSchema(
          { slug: listing.slug, title: listing.title, attributes: listing.attributes },
          displayGalleryMedia[0]?.storage_path ?? null
        )}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Properties", path: "/properties" },
          ...(location
            ? [{ name: location.split(",")[0]!.trim(), path: `/destinations/${destinationSlug(location)}` }]
            : []),
          { name: listing.title, path: `/listing/${listing.slug}` },
        ])}
      />
      <header className="w-[min(100%,_900px)] mb-7 mx-auto [&_h1]:max-w-212.5 [&_h1]:mt-4.5 [&_h1]:mb-3 [&_h1]:text-heading
        [&_h1]:text-[clamp(34px,_4.1vw,_58px)] [&_h1]:leading-[1.08] [&_h1]:tracking-[0] [&_h1]:mx-0
        [&_h1]:max-[560.001px]:text-[clamp(24px,_7vw,_34px)] [&_h1]:max-[560.001px]:leading-[1.18]">
        {category && (
          <Link href={`/listing-category/${category.slug}`} className="inline-flex items-center min-h-6 bg-button-bg text-button-text text-[11px] font-extrabold tracking-[0.07em] leading-none uppercase
            px-3 py-0 rounded-full">
            {category.name}
          </Link>
        )}
        <h1>{listing.title}</h1>
        {/* Where the property is, with a pin rather than a verified tick.
            The tick said nothing a guest acts on and competed with the town
            for the same line; a pin tells them what the line IS. */}
        {location && (
          <p className="listing-detail__meta flex flex-wrap items-center mt-0 mb-6 mx-0">
            <Link
              /* The destination page, not a filtered /properties URL. Both
                 show the same properties, but only one of them is a page
                 Google can index and rank for "vacation rentals in El Zonte"
                 -- and a link from every property in the town is what tells a
                 crawler it matters. */
              href={`/destinations/${destinationSlug(location)}`}
              className="[.listing-detail\_\_meta_&]:inline-flex [.listing-detail\_\_meta_&]:items-center [.listing-detail\_\_meta_&]:mb-0
                [.listing-detail\_\_meta_&]:text-body-text [.listing-detail\_\_meta_&]:text-[14px] [.listing-detail\_\_meta_&]:no-underline
                [.listing-detail\_\_meta_&]:[transition:color_160ms_ease] [.listing-detail\_\_meta_&]:gap-1.5
                [.listing-detail\_\_meta_&:hover]:text-text [.listing-detail\_\_meta_&:hover]:underline
                [.listing-detail\_\_meta_&:hover]:underline-offset-[3px] [.listing-detail\_\_meta_&:focus-visible]:text-text
                [.listing-detail\_\_meta_&:focus-visible]:underline [.listing-detail\_\_meta_&:focus-visible]:underline-offset-[3px]
                [.listing-detail\_\_meta_&_svg]:flex-none [.listing-detail\_\_meta_&_svg]:text-current inline-block mb-1 text-[14px]
                text-link-strong"
            >
              <MapPin size={15} strokeWidth={2} aria-hidden="true" />
              <span>{location}</span>
            </Link>
          </p>
        )}
      </header>

      {displayGalleryMedia.length > 0 && (
        <div className="listing-gallery-block">
          <ListingGallery media={displayGalleryMedia} title={listing.title}>
            {/* A link, not a button: the tour is a section further down this
                page, so it works before hydration and with JavaScript off. */}
            {tourPhotoCount > 0 && (
              <a className="inline-flex items-center no-underline absolute right-[clamp(14px,_3vw,_48px)] bottom-5 z-[3] min-h-10
                bg-[rgba(255,_255,_255,_0.96)] text-heading [font-family:inherit] text-[14px] font-semibold [font-style:inherit] leading-[inherit]
                [font-variant:inherit] cursor-pointer shadow-[0_3px_14px_rgba(15,_23,_39,_0.22)]
                [transition:background-color_0.15s_ease,_transform_0.15s_ease] px-3.5 py-0 gap-2 rounded-[10px] border border-solid
                border-[rgba(15,_23,_39,_0.12)] hover:bg-white hover:[transform:translateY(-1px)] focus-visible:bg-white
                focus-visible:[transform:translateY(-1px)] motion-reduce:transition-none max-[560.001px]:right-3 max-[560.001px]:bottom-3.5
                max-[560.001px]:min-h-9 max-[560.001px]:text-[13px] max-[560.001px]:px-2.75 max-[560.001px]:py-0 max-[560.001px]:gap-1.5" href="#photos">
                <LayoutGrid size={15} aria-hidden="true" />
                Take photo tour
              </a>
            )}
          </ListingGallery>
          {/* Phone only: on a desktop the same offer is a card beside the
              booking form, which a phone does not have room for. */}
          <div className="hidden max-[960.001px]:grid max-[960.001px]:justify-items-start max-[960.001px]:mt-[-18px] max-[960.001px]:mb-6.5
            max-[960.001px]:bg-[#394342] max-[960.001px]:text-white max-[960.001px]:mx-0 max-[960.001px]:p-5 max-[960.001px]:gap-2
            max-[960.001px]:rounded-[10px] [&_h2]:max-[960.001px]:text-white [&_h2]:max-[960.001px]:text-[20px]
            [&_h2]:max-[960.001px]:leading-[1.3] [&_h2]:max-[960.001px]:m-0 [&_p]:max-[960.001px]:mt-0 [&_p]:max-[960.001px]:mb-1.5
            [&_p]:max-[960.001px]:text-[14px] [&_p]:max-[960.001px]:leading-[1.5] [&_p]:max-[960.001px]:text-[rgba(255,_255,_255,_0.82)]
            [&_p]:max-[960.001px]:mx-0">
            <h2>{CONCIERGE.title}</h2>
            <p>{CONCIERGE.body}</p>
            <Link className="max-[960.001px]:inline-block max-[960.001px]:bg-white max-[960.001px]:text-[#394342] max-[960.001px]:text-[14px]
              max-[960.001px]:font-semibold max-[960.001px]:leading-[1.35] max-[960.001px]:no-underline max-[960.001px]:px-4
              max-[960.001px]:py-2.75 max-[960.001px]:rounded-full max-[960.001px]:hover:bg-[rgba(255,_255,_255,_0.9)]
              max-[960.001px]:focus-visible:bg-[rgba(255,_255,_255,_0.9)]" href={buildConciergeHref({ listingSlug: listing.slug })}>
              {CONCIERGE.action}
            </Link>
          </div>
        </div>
      )}

      <div className="w-[min(100%,_900px)] grid grid-cols-[minmax(0,_1fr)_minmax(260px,_320px)] gap-x-[clamp(40px,_5vw,_72px)] gap-y-0 items-start
        mx-auto max-[960.001px]:grid-cols-1" id="details">
        <div className="min-w-0 max-[960.001px]:col-auto max-[960.001px]:row-auto min-[961px]:col-[1] min-[961px]:row-[1]">
          {nightlyRate && (
            <p className="flex items-baseline mt-0 mb-5 font-heading font-medium text-heading mx-0 gap-1.5">
              <strong className="text-[26px] font-medium tabular-nums">{nightlyRate}</strong>{" "}
              <span className="font-body text-[15px] font-normal text-muted-text">per night</span>
            </p>
          )}
          {amenityRows.length > 0 && (
            <ul className="grid grid-cols-2 gap-y-1 gap-x-8 list-none pl-0 mt-0 mb-6 mx-0 [&_li]:flex [&_li]:items-center [&_li]:text-[16px]
              [&_li]:leading-[24px] [&_li]:gap-2 max-[640.001px]:grid-cols-1 [.properties-results_.listing-card--archive_&]:grid
              [.properties-results_.listing-card--archive_&]:grid-cols-2 [.properties-results_.listing-card--archive_&]:gap-y-2.25
              [.properties-results_.listing-card--archive_&]:gap-x-5 [.properties-results_.listing-card--archive_&]:w-full
              [.properties-results_.listing-card--archive_&]:mt-0 [.properties-results_.listing-card--archive_&]:mb-5
              [.properties-results_.listing-card--archive_&]:mx-0 [.related-listings_.listing-card--archive_&]:grid
              [.related-listings_.listing-card--archive_&]:grid-cols-2 [.related-listings_.listing-card--archive_&]:gap-y-2.25
              [.related-listings_.listing-card--archive_&]:gap-x-5 [.related-listings_.listing-card--archive_&]:w-full
              [.related-listings_.listing-card--archive_&]:mt-0 [.related-listings_.listing-card--archive_&]:mb-5
              [.related-listings_.listing-card--archive_&]:mx-0 [.properties-results_.listing-card--archive_&_li]:items-start
              [.properties-results_.listing-card--archive_&_li]:text-[13px] [.properties-results_.listing-card--archive_&_li]:leading-[18px]
              [.related-listings_.listing-card--archive_&_li]:items-start [.related-listings_.listing-card--archive_&_li]:text-[13px]
              [.related-listings_.listing-card--archive_&_li]:leading-[18px] [.properties-results_.listing-card--archive_&_svg]:grow-0
              [.properties-results_.listing-card--archive_&_svg]:shrink-0 [.properties-results_.listing-card--archive_&_svg]:basis-5.5
              [.related-listings_.listing-card--archive_&_svg]:grow-0 [.related-listings_.listing-card--archive_&_svg]:shrink-0
              [.related-listings_.listing-card--archive_&_svg]:basis-5.5 [.listing-card--archive_&]:mb-4
              [.listing-card--archive_&_li]:text-[12px] [.listing-card--archive_&_li]:leading-[18px]
              [.properties-results_.listing-card--archive_&]:max-[560.001px]:grid-cols-1">
              {amenityRows.map((row) => (
                <li key={row.label} className={row.wide ? "[&&]:col-span-full" : undefined}>
                  <AmenityIcon type={row.icon} />
                  <span className="text-heading font-bold whitespace-nowrap">{row.label}:</span> {row.value}
                </li>
              ))}
            </ul>
          )}
          {/* Migrated listing copy is plain text, so it is parsed into real
              paragraphs, headings and bullet lists. A listing whose body is
              genuine markup takes the HTML path — sanitised first, since it
              can be edited from the admin and is injected as raw HTML. */}
          {descriptionHtml !== null ? (
            <div
              className="text-body-text text-[16px] leading-[30px] [&_p]:mt-0 [&_p]:mb-4 [&_p]:mx-0 [&_h3]:mt-6.5 [&_h3]:mb-2.5 [&_h3]:text-[18px]
                [&_h3]:leading-[22.5px] [&_h3]:text-heading [&_h3]:mx-0 [&>:first-child]:mt-0"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          ) : (
            /* The summary stays open and has no control to close it; every
               other section starts closed and is opened by a click.
               `<details>` rather than a click handler: it needs no
               JavaScript, it is keyboard-operable and screen-reader-announced
               for free, and it keeps this page a server component. */
            <div className="text-body-text text-[16px] leading-[30px] [&_p]:mt-0 [&_p]:mb-4 [&_p]:mx-0 [&_h3]:mt-6.5 [&_h3]:mb-2.5 [&_h3]:text-[18px]
              [&_h3]:leading-[22.5px] [&_h3]:text-heading [&_h3]:mx-0 [&>:first-child]:mt-0">
              {(() => {
                const { summary, sections } = descriptionSections;
                return (
                  <>
                    {summary.map((block, i) => renderBlock(block, i))}
                    {sections.length > 0 && (
                      <div className="flex flex-col mt-6.5 mb-0 border-t border-solid border-t-border mx-0">
                        {sections.map((section) => (
                          <details key={section.title} className="listing-sections__item border-b border-solid border-b-border">
                            <summary className="flex items-center justify-between cursor-pointer font-heading text-[17px] font-medium text-heading list-none
                              [transition:color_160ms_ease] px-0.5 py-3.75 gap-4 [&::-webkit-details-marker]:hidden hover:text-text
                              focus-visible:[outline:2px_solid_var(--color-link)] focus-visible:outline-offset-[2px] focus-visible:rounded-[3px]">
                              <span>{section.title}</span>
                              <ChevronDown
                                size={18}
                                className="flex-none text-muted-text [transition:transform_200ms_ease] [.listing-sections\_\_item[open]_&]:[transform:rotate(180deg)]
                                  motion-reduce:transition-none"
                                aria-hidden="true"
                              />
                            </summary>
                            <div className="pt-0 pb-4.5 px-0.5 [&>:first-child]:mt-0">
                              {section.blocks.map((block, i) => renderBlock(block, i))}
                            </div>
                          </details>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

        </div>

        {/* Between the description and the photographs: a guest reads what the
            place is, watches it, then looks at the rooms. Its own row across
            the grid for the same reason the tour has one -- a video letterboxed
            into a 500px column is a thumbnail. Renders nothing when the listing
            has no video_url attribute. */}
        <ListingVideo url={attrs.video_url} title={listing.title} />

        {/*
          A row of its own across the body grid, not a block inside the narrow
          main column: photographs shown 250px wide are a contact sheet.

          It stays between the description and the booking form in the DOM,
          which is the order a phone gets once the grid collapses to one
          column -- read what the place is, look at it, then book.
        */}
        <PhotoTour groups={tourGroups} title={listing.title} />

        {/* Real reviews, and only where there are some: a listing with none
            shows no section at all rather than an empty one. */}
        {listingReviews.length > 0 && <ListingReviews reviews={listingReviews} />}

        <aside className="sticky top-6 scroll-mt-22.5 max-[960.001px]:static max-[960.001px]:col-auto max-[960.001px]:row-auto min-[961px]:col-[2]
          min-[961px]:row-[1]" id="book" aria-label="Reservation widget">
          <BookingWidget
            listingId={listing.id}
            listingTitle={listing.title}
            listingSlug={listing.slug}
            price={attrValue(attrs, "price")}
            cleaningFee={attrValue(attrs, "cleaning_fee")}
            minNights={attrs.booking_min_length}
            checkoutMode={checkoutMode}
          />

          {/* The other half of a stay: how they get here, what they drive,
              what they do. Under the form, not competing with it -- the room
              is still the thing being sold on this page. */}
          <div className="mt-4.5 bg-[#394342] text-white shadow-[0_8px_30px_rgba(15,_23,_39,_0.16)] p-6 rounded-[10px] [&_h2]:mt-0 [&_h2]:mb-1.5
            [&_h2]:text-white [&_h2]:text-[20px] [&_h2]:leading-[1.3] [&_h2]:mx-0 [&_p]:mt-0 [&_p]:mb-4.5 [&_p]:text-[14px]
            [&_p]:leading-[1.55] [&_p]:text-[rgba(255,_255,_255,_0.82)] [&_p]:mx-0 max-[960.001px]:hidden">
            <h2>{CONCIERGE.title}</h2>
            <p>{CONCIERGE.body}</p>
            <Link className="inline-block bg-white text-[#394342] text-[14px] font-semibold no-underline px-4.5 py-2.75 rounded-full border border-solid
              border-[#fff] hover:bg-[rgba(255,_255,_255,_0.9)] focus-visible:bg-[rgba(255,_255,_255,_0.9)]" href={buildConciergeHref({ listingSlug: listing.slug })}>
              {CONCIERGE.action}
            </Link>
          </div>
        </aside>
      </div>

      {relatedListings.length > 0 && (
        <section className="related-listings w-[min(100%,_900px)] mt-[clamp(48px,_6vw,_78px)] mb-0 mx-auto [&_h2]:mt-0 [&_h2]:mb-7 [&_h2]:text-heading
          [&_h2]:text-[clamp(30px,_3vw,_38px)] [&_h2]:leading-[1.1] [&_h2]:mx-0 [&_h2::before]:content-[''] [&_h2::before]:block
          [&_h2::before]:w-11.5 [&_h2::before]:h-1 [&_h2::before]:bg-button-bg [&_h2::before]:mb-3.5 [&_h2::before]:rounded-full">
          <h2>Related Listings</h2>
          <div className="grid grid-cols-3 mx-0 my-6 gap-6 max-[960.001px]:grid-cols-2 max-[640.001px]:grid-cols-1
            [.related-listings_&]:grid-cols-[repeat(auto-fill,_minmax(250px,_1fr))] [.related-listings_&]:m-0 [.related-listings_&]:gap-7.5
            [.properties-results_&]:grid-cols-[repeat(auto-fill,_minmax(250px,_1fr))] [.properties-results_&]:gap-y-8.5
            [.properties-results_&]:gap-x-8 [.properties-results_&]:m-0 [.properties-results_&]:max-[860.001px]:grid-cols-1">
            {relatedListings.map((related) => {
              const relatedAttrs = (related.attributes as Record<string, string>) ?? {};
              const relatedCategory = related.categories[0];
              const relatedSummary = buildListingSummary(relatedAttrs);
              /* The same three facts the archive cards carry -- collection,
                 town, nightly rate. The collection is shown here because
                 these cards sit in one grid with no heading over them, so a
                 card is the only thing that can say which building it is. */
              const relatedCollection = listingBuilding(relatedAttrs);
              const relatedTown = relatedAttrs.location?.split(",")[0]?.trim() || null;
              const relatedRate = (() => {
                const raw = String(attrValue(relatedAttrs, "price") ?? "").trim();
                if (!raw || raw.includes("-")) return null;
                const value = Number.parseFloat(raw.replace(/[^0-9.]/g, ""));
                if (!Number.isFinite(value) || value <= 0) return null;
                return new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                }).format(value);
              })();
              return (
                <article key={related.id} className="listing-card shadow-[0_5px_30px_rgba(7,_36,_86,_0.075)] flex flex-col items-start px-6 py-5 rounded-[10px]
                  [&_h3]:[display:-webkit-box] [&_h3]:[-webkit-box-orient:vertical] [&_h3]:[-webkit-line-clamp:3] [&_h3]:min-h-[calc(3_*_1.25em)]
                  [&_h3]:overflow-hidden [&_h3]:text-[20px] [&_h3]:leading-[1.25] [&_h3]:mt-0 [&_h3]:mb-2 [&_h3]:mx-0 [&_h3_a]:text-heading
                  [.properties-results_&]:min-h-full [.properties-results_&]:pt-0 [.properties-results_&]:pb-6.5
                  [.properties-results_&]:overflow-hidden [.properties-results_&]:bg-background
                  [.properties-results_&]:shadow-[0_24px_55px_rgba(7,_36,_86,_0.08)]
                  [.properties-results_&]:[transition:transform_180ms_ease-out,_box-shadow_180ms_ease-out] [.properties-results_&]:px-7.5
                  [.properties-results_&]:rounded-[8px] [.related-listings_&]:min-h-full [.related-listings_&]:pt-0 [.related-listings_&]:pb-6.5
                  [.related-listings_&]:overflow-hidden [.related-listings_&]:bg-background
                  [.related-listings_&]:shadow-[0_24px_55px_rgba(7,_36,_86,_0.08)]
                  [.related-listings_&]:[transition:transform_180ms_ease-out,_box-shadow_180ms_ease-out] [.related-listings_&]:px-7.5
                  [.related-listings_&]:rounded-[8px] [.properties-results_&:hover]:[transform:translateY(-3px)]
                  [.properties-results_&:hover]:shadow-[0_30px_70px_rgba(7,_36,_86,_0.12)] [.related-listings_&:hover]:[transform:translateY(-3px)]
                  [.related-listings_&:hover]:shadow-[0_30px_70px_rgba(7,_36,_86,_0.12)] [.properties-results_&_h3]:max-w-[95%]
                  [.properties-results_&_h3]:mb-4.5 [.properties-results_&_h3]:text-[21px] [.properties-results_&_h3]:leading-[26.25px]
                  [.related-listings_&_h3]:max-w-[95%] [.related-listings_&_h3]:mb-4.5 [.related-listings_&_h3]:text-[21px]
                  [.related-listings_&_h3]:leading-[26.25px] [.properties-results_&]:max-[560.001px]:pt-0
                  [.properties-results_&]:max-[560.001px]:pb-5.5 [.properties-results_&]:max-[560.001px]:px-5 listing-card--archive">
                  <div className="relative block [.properties-results_&]:w-[calc(100%_+_60px)] [.properties-results_&]:mt-0 [.properties-results_&]:mb-5.5
                    [.properties-results_&]:overflow-hidden [.properties-results_&]:rounded-tl-[8px] [.properties-results_&]:rounded-tr-[8px]
                    [.properties-results_&]:rounded-br-[0] [.properties-results_&]:rounded-bl-[0] [.properties-results_&]:mx-[-30px]
                    [.related-listings_&]:w-[calc(100%_+_60px)] [.related-listings_&]:mt-0 [.related-listings_&]:mb-5.5
                    [.related-listings_&]:overflow-hidden [.related-listings_&]:rounded-tl-[8px] [.related-listings_&]:rounded-tr-[8px]
                    [.related-listings_&]:rounded-br-[0] [.related-listings_&]:rounded-bl-[0] [.related-listings_&]:mx-[-30px]
                    [.properties-results_&]:max-[560.001px]:w-[calc(100%_+_40px)] [.properties-results_&]:max-[560.001px]:mx-[-20px]">
                    {related.featured_media && (
                      <Link href={`/listing/${related.slug}`}>
                        <Image
                          className="block w-[calc(100%_+_48px)] h-40 object-cover rounded-tl-[10px] rounded-tr-[10px] rounded-br-[0] rounded-bl-[0] mt-[-20px] mb-4
                            mx-[-24px] [.properties-results_&]:w-full [.properties-results_&]:h-[clamp(210px,_18vw,_260px)]
                            [.properties-results_&]:[transition:transform_450ms_cubic-bezier(0.22,_1,_0.36,_1)] [.properties-results_&]:m-0
                            [.properties-results_&]:rounded-[0] [.related-listings_&]:w-full [.related-listings_&]:h-[clamp(210px,_18vw,_260px)]
                            [.related-listings_&]:[transition:transform_450ms_cubic-bezier(0.22,_1,_0.36,_1)] [.related-listings_&]:m-0
                            [.related-listings_&]:rounded-[0] [.properties-results_.listing-card:hover_&]:[transform:scale(1.035)]
                            [.related-listings_.listing-card:hover_&]:[transform:scale(1.035)]
                            [.properties-results_&]:max-[860.001px]:h-[clamp(220px,_56vw,_360px)]"
                          src={mediaPublicUrl(related.featured_media.storage_path)}
                          width={640}
                          height={420}
                          sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw"
                          alt={related.featured_media.alt_text || related.title}
                          loading="lazy"
                        />
                      </Link>
                    )}
                    {relatedCategory && (
                      <Link href={`/listing-category/${relatedCategory.slug}`} className="absolute left-6 bottom-4 z-[1] inline-block bg-[rgba(255,_255,_255,_0.35)] text-white text-[11px] font-normal uppercase
                        tracking-[0.04em] no-underline px-3 py-1.5 rounded-full [.properties-results_&]:left-7.5 [.properties-results_&]:bottom-5.5
                        [.properties-results_&]:bg-[rgba(246,_248,_245,_0.78)] [.properties-results_&]:text-button-bg [.properties-results_&]:text-[11px]
                        [.properties-results_&]:font-extrabold [.related-listings_&]:left-7.5 [.related-listings_&]:bottom-5.5
                        [.related-listings_&]:bg-[rgba(246,_248,_245,_0.78)] [.related-listings_&]:text-button-bg [.related-listings_&]:text-[11px]
                        [.related-listings_&]:font-extrabold [.properties-results_&]:max-[560.001px]:left-5">
                        {relatedCategory.name}
                      </Link>
                    )}
                  </div>
                  {relatedCollection && (
                    <p className="listing-card__collection mt-3.5 mb-0.5 text-[10.5px] font-extrabold tracking-[1px] uppercase text-muted-text mx-0">{relatedCollection}</p>
                  )}
                  <h3>
                    <Link href={`/listing/${related.slug}`}>{related.title}</Link>
                  </h3>
                  {relatedTown && (
                    <p className="flex items-center mt-1.5 mb-0 text-[13.5px] text-body-text mx-0 gap-1.25 [&_svg]:flex-none [&_svg]:text-current">
                      <MapPin size={14} strokeWidth={2} aria-hidden="true" />
                      <span>{relatedTown}</span>
                    </p>
                  )}
                  {relatedSummary.length > 0 && (
                    <p className="flex flex-wrap items-center mt-2 mb-0 list-none text-body-text text-[14px] leading-[20px] tabular-nums min-h-5 mx-0 p-0
                      [&>span]:inline-flex [&>span]:items-center [&>span]:whitespace-nowrap [&>span]:gap-1 [&>span+span::before]:content-['·']
                      [&>span+span::before]:text-muted-text [&>span+span::before]:mx-1.5 [&>span+span::before]:my-0
                      [.listing-card_&]:max-[640.001px]:grid [.listing-card_&]:max-[640.001px]:grid-cols-2 [.listing-card_&]:max-[640.001px]:gap-y-1
                      [.listing-card_&]:max-[640.001px]:gap-x-2.5 [.listing-card_&>span+span::before]:max-[640.001px]:content-[none]">
                      {relatedSummary.map((item) => (
                        <span key={item.label}>
                          <AmenityIcon type={item.icon} className="grow-0 shrink-0 basis-4 w-4 h-4 text-muted-text" />
                          {item.value} {item.label}
                        </span>
                      ))}
                    </p>
                  )}
                  {relatedRate && (
                    <p className="flex items-baseline mt-2.5 mb-0 font-heading text-heading mx-0 gap-1.25 [&_strong]:text-[19px] [&_strong]:font-semibold
                      [&_strong]:tabular-nums">
                      <strong>{relatedRate}</strong>{" "}
                      <span className="font-body text-[13px] font-normal text-muted-text">per night</span>
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/*
        The dates a guest picks in the phone bar are the dates the form gets:
        both read the provider, so Reserve now lands on a form that already
        knows when they want to come. See modules/bookings/providers/BookingDates.tsx.
      */}
      <MobileBookBar nightlyRate={nightlyRate} minNights={attrs.booking_min_length} />
    </article>
    </BookingDatesProvider>
  );
}
