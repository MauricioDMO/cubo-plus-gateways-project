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
      <ul key={key} className="listing-detail__list">
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
    <article className="listing-detail">
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
      <header className="listing-detail__hero">
        {category && (
          <Link href={`/listing-category/${category.slug}`} className="listing-detail__category">
            {category.name}
          </Link>
        )}
        <h1>{listing.title}</h1>
        {/* Where the property is, with a pin rather than a verified tick.
            The tick said nothing a guest acts on and competed with the town
            for the same line; a pin tells them what the line IS. */}
        {location && (
          <p className="listing-detail__meta">
            <Link
              /* The destination page, not a filtered /properties URL. Both
                 show the same properties, but only one of them is a page
                 Google can index and rank for "vacation rentals in El Zonte"
                 -- and a link from every property in the town is what tells a
                 crawler it matters. */
              href={`/destinations/${destinationSlug(location)}`}
              className="listing-detail__location"
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
              <a className="photo-tour__opener" href="#photos">
                <LayoutGrid size={15} aria-hidden="true" />
                Take photo tour
              </a>
            )}
          </ListingGallery>
          {/* Phone only: on a desktop the same offer is a card beside the
              booking form, which a phone does not have room for. */}
          <div className="plan-banner">
            <h2>{CONCIERGE.title}</h2>
            <p>{CONCIERGE.body}</p>
            <Link className="plan-banner__link" href={buildConciergeHref({ listingSlug: listing.slug })}>
              {CONCIERGE.action}
            </Link>
          </div>
        </div>
      )}

      <div className="listing-detail__body" id="details">
        <div className="listing-detail__main">
          {nightlyRate && (
            <p className="listing-price">
              <strong className="listing-price__amount">{nightlyRate}</strong>{" "}
              <span className="listing-price__unit">per night</span>
            </p>
          )}
          {amenityRows.length > 0 && (
            <ul className="amenity-checklist">
              {amenityRows.map((row) => (
                <li key={row.label} className={row.wide ? "amenity-checklist__row--wide" : undefined}>
                  <AmenityIcon type={row.icon} />
                  <span className="amenity-checklist__label">{row.label}:</span> {row.value}
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
              className="listing-detail__content"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          ) : (
            /* The summary stays open and has no control to close it; every
               other section starts closed and is opened by a click.
               `<details>` rather than a click handler: it needs no
               JavaScript, it is keyboard-operable and screen-reader-announced
               for free, and it keeps this page a server component. */
            <div className="listing-detail__content">
              {(() => {
                const { summary, sections } = descriptionSections;
                return (
                  <>
                    {summary.map((block, i) => renderBlock(block, i))}
                    {sections.length > 0 && (
                      <div className="listing-sections">
                        {sections.map((section) => (
                          <details key={section.title} className="listing-sections__item">
                            <summary className="listing-sections__title">
                              <span>{section.title}</span>
                              <ChevronDown
                                size={18}
                                className="listing-sections__chevron"
                                aria-hidden="true"
                              />
                            </summary>
                            <div className="listing-sections__body">
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

        <aside className="listing-detail__booking" id="book" aria-label="Reservation widget">
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
          <div className="plan-card">
            <h2>{CONCIERGE.title}</h2>
            <p>{CONCIERGE.body}</p>
            <Link className="plan-card__link" href={buildConciergeHref({ listingSlug: listing.slug })}>
              {CONCIERGE.action}
            </Link>
          </div>
        </aside>
      </div>

      {relatedListings.length > 0 && (
        <section className="related-listings">
          <h2>Related Listings</h2>
          <div className="listing-grid">
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
                <article key={related.id} className="listing-card listing-card--archive">
                  <div className="listing-card__media">
                    {related.featured_media && (
                      <Link href={`/listing/${related.slug}`}>
                        <Image
                          className="listing-card__thumb"
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
                      <Link href={`/listing-category/${relatedCategory.slug}`} className="listing-card__category">
                        {relatedCategory.name}
                      </Link>
                    )}
                  </div>
                  {relatedCollection && (
                    <p className="listing-card__collection">{relatedCollection}</p>
                  )}
                  <h3>
                    <Link href={`/listing/${related.slug}`}>{related.title}</Link>
                  </h3>
                  {relatedTown && (
                    <p className="listing-card__place">
                      <MapPin size={14} strokeWidth={2} aria-hidden="true" />
                      <span>{relatedTown}</span>
                    </p>
                  )}
                  {relatedSummary.length > 0 && (
                    <p className="listing-summary">
                      {relatedSummary.map((item) => (
                        <span key={item.label}>
                          <AmenityIcon type={item.icon} className="listing-summary__icon" />
                          {item.value} {item.label}
                        </span>
                      ))}
                    </p>
                  )}
                  {relatedRate && (
                    <p className="listing-card__price">
                      <strong>{relatedRate}</strong>{" "}
                      <span className="listing-card__price-unit">per night</span>
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
