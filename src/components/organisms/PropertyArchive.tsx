import Link from "next/link";
import Image from "next/image";
import { mediaPublicUrl } from "@/shared/media/media";
import { amenityFilterFields, buildListingSummary } from "@/modules/listings/amenities";
import { attrValue } from "@/modules/bookings/booking-quote";
import {
  ARCHIVE_PAGE_SIZE,
  filterListings,
  paginate,
  parseArchiveFilters,
  parseArchivePage,
  type ArchiveSearchParams,
} from "@/modules/listings/properties-filter";
import PropertyFiltersPanel from "@/components/organisms/PropertyFiltersPanel";
import { AmenityIcon } from "@/components/atoms/icons";
import { MapPin } from "lucide-react";
import { listingTown, matchesDestination } from "@/modules/listings/locations";
import { groupByBuilding, listingBuilding } from "@/modules/listings/listing-buildings";

type ArchiveListingItem = {
  id: number;
  slug: string;
  title: string;
  attributes: unknown;
  categories: Array<{ id: number; name: string; slug: string }>;
  pets?: string | null;
  petsSlug?: string | null;
  featured_media: { storage_path: string; alt_text: string | null } | null;
};

type CategoryOption = { id: number; name: string; slug: string };

type PropertyArchiveProps = {
  listings: ArchiveListingItem[];
  categories: CategoryOption[];
  searchParams: ArchiveSearchParams;
  basePath: string;
  categoryLinks?: boolean;
  activeCategorySlug?: string;
  /**
   * Listings already taken for the searched dates. Resolved by the page (it
   * needs the service-role client), so this component stays a pure renderer.
   */
  unavailableListingIds?: Set<number>;
};

/*
 * The homepage search bar sends its three answers here as query params. They
 * are not sidebar filters -- they arrive already chosen -- so they get their
 * own summary row, and every sidebar form has to carry them through or a
 * guest who then ticks "WiFi" would silently lose their destination.
 *
 * `guests` is deliberately NOT among them any more: the sidebar now has a
 * visible field for it, and a hidden input of the same name would submit the
 * party size twice -- the browser sending both, the arriving value being
 * whichever came last in the form rather than the one the guest typed.
 */
const SEARCH_PARAM_KEYS = ["destination", "check_in", "check_out"] as const;

/**
 * The options a capacity filter offers, taken from the catalogue rather than
 * guessed: 1..the largest figure any live property records.
 *
 * Derived for the same reason the homepage guest picker is -- a property that
 * sleeps eight should widen the choice by being published, not by somebody
 * remembering to edit an array here. Clamped so one mistyped attribute cannot
 * render forty chips.
 */
export function capacityChoices(listings: Array<{ attributes: unknown }>, key: string, cap = 12): number[] {
  let max = 0;
  for (const listing of listings) {
    const raw = (listing.attributes as Record<string, string> | null)?.[key];
    const value = Number.parseInt(raw ?? "", 10);
    if (Number.isFinite(value) && value > max) max = value;
  }
  return Array.from({ length: Math.min(Math.max(max, 1), cap) }, (_, index) => index + 1);
}

function formatSearchDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(year, month - 1, day)
  );
}

function buildHref(basePath: string, searchParams: ArchiveSearchParams, overrides: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) params.delete(key);
    else params.set(key, value);
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

/**
 * The nightly rate, whole dollars.
 *
 * Cents on a nightly rate are noise -- every rate in the catalogue is a round
 * number -- and the listing page says "From $120 per night", so a card that
 * says the same thing reads as the same fact rather than a different one.
 * A property with no price recorded shows no price line at all: an invented
 * "$0" or "Price on request" would both be lies.
 *
 * Reads the price through the same attrValue rule the quote engine uses
 * (modules/bookings/booking-quote.ts) -- a listing priced only by the sync, with no
 * manual override, used to show no price here at all.
 */
function nightlyRate(attributes: Record<string, string>): string | null {
  const raw = String(attrValue(attributes, "price") ?? "").trim();
  if (!raw || raw.includes("-")) return null;
  const value = Number.parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(value) || value <= 0) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PropertyArchive({
  listings,
  categories,
  searchParams,
  basePath,
  categoryLinks = false,
  activeCategorySlug,
  unavailableListingIds,
}: PropertyArchiveProps) {
  const amenityFields = amenityFilterFields();
  const filters = parseArchiveFilters(searchParams, amenityFields.map((field) => field.key));
  const page = parseArchivePage(searchParams);

  const effectiveFilters = categoryLinks ? { ...filters, category: undefined } : filters;
  const filtered = filterListings(listings, effectiveFilters);

  // Properties booked for the searched dates are dropped from the grid, but
  // counted, so the page can say "3 more are booked for these dates" instead
  // of quietly looking like a thinner catalogue.
  const bookedOut = unavailableListingIds
    ? filtered.filter((listing) => unavailableListingIds.has(listing.id)).length
    : 0;
  const available = unavailableListingIds
    ? filtered.filter((listing) => !unavailableListingIds.has(listing.id))
    : filtered;

  /*
   * Properties in the same building are made adjacent BEFORE paginating.
   *
   * Six of the apartments are in Zonset Surf Residences and three are in
   * Barefoot Surf & Sand, and with a page size of six the catalogue order put
   * some of each on both pages -- so the grouping headings below would have
   * repeated and read as four buildings instead of two. Grouping is stable, so
   * the catalogue order still holds inside each building.
   */
  const sorted = groupByBuilding(available).flatMap((group) => group.listings);
  const { pageItems, totalCount, totalPages } = paginate(sorted, page, ARCHIVE_PAGE_SIZE);
  const buildingGroups = groupByBuilding(pageItems);
  /*
   * The heading counts the whole building, not the part of it on this page.
   *
   * Zonset has six apartments and the page holds six properties, so the
   * building spans two pages. Counting the slice made page 1 say "3 stays"
   * and page 2 say "3 stays" for the same building -- a number that is wrong
   * on both pages.
   */
  const countByBuilding = new Map(
    groupByBuilding(sorted).map((group) => [group.building ?? "", group.listings.length])
  );
  // One unnamed group is not a grouping -- it is the plain grid, which is what
  // a catalogue with no buildings recorded should still look like.
  const showBuildingHeadings = buildingGroups.length > 1 || buildingGroups[0]?.building != null;
  const guestChoices = capacityChoices(listings, "guests");
  const bedroomChoices = capacityChoices(listings, "bedrooms");
  const bathroomChoices = capacityChoices(listings, "bathrooms");
  const activeFilterCount =
    filters.amenities.length +
    (filters.q ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.parkingMin ? 1 : 0) +
    (filters.bedroomsMin ? 1 : 0) +
    (filters.bathroomsMin ? 1 : 0) +
    (filters.petsSlug ? 1 : 0) +
    (filters.destination ? 1 : 0) +
    (filters.guestsMin ? 1 : 0);

  const searchDestination = filters.destination
    ? (listings.find((listing) => matchesDestination(listing.attributes, filters.destination!))?.attributes as
        | Record<string, string>
        | undefined
      )?.location ?? filters.destination
    : undefined;
  const searchCheckIn = firstParam(searchParams.check_in);
  const searchCheckOut = firstParam(searchParams.check_out);
  const hasSearch = Boolean(searchDestination || (searchCheckIn && searchCheckOut) || filters.guestsMin);

  return (
    <>
      {hasSearch && (
        <div className="properties-searchsummary">
          <span className="properties-searchsummary__label">Your search</span>
          <ul className="properties-searchsummary__chips">
            {searchDestination && <li>{searchDestination}</li>}
            {searchCheckIn && searchCheckOut && (
              <li>
                {formatSearchDate(searchCheckIn)} – {formatSearchDate(searchCheckOut)}
              </li>
            )}
            {filters.guestsMin && (
              <li>
                {filters.guestsMin} {filters.guestsMin === 1 ? "guest" : "guests"}
              </li>
            )}
            {/* Inside the chip row rather than beside it: as a separate block
                it forced the row onto its own line and cost a phone 60px. */}
            <li className="properties-searchsummary__clear-chip">
              <Link href={basePath}>Clear</Link>
            </li>
          </ul>
        </div>
      )}
      <div className="properties-layout">
        <PropertyFiltersPanel activeFilterCount={activeFilterCount}>
          <form method="get" action={basePath}>
            {/* Without these the sidebar's "Filter" button would throw away
                the destination, dates and party size the guest arrived with. */}
            {SEARCH_PARAM_KEYS.map((key) => {
              const value = firstParam(searchParams[key]);
              return value ? <input key={key} type="hidden" name={key} value={value} /> : null;
            })}

            <fieldset className="properties-filters__group">
              <legend>Category</legend>
              {categoryLinks ? (
                <>
                  <Link
                    href="/properties"
                    className={`properties-filters__radio${!activeCategorySlug ? " properties-filters__radio--active" : ""}`}
                  >
                    <span className="properties-filters__radio-dot" aria-hidden="true" />
                    All Categories
                  </Link>
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/listing-category/${category.slug}`}
                      className={`properties-filters__radio${activeCategorySlug === category.slug ? " properties-filters__radio--active" : ""}`}
                    >
                      <span className="properties-filters__radio-dot" aria-hidden="true" />
                      {category.name}
                    </Link>
                  ))}
                </>
              ) : (
                <>
                  <label className="properties-filters__radio">
                    <input type="radio" name="category" value="" defaultChecked={!filters.category} />
                    All Categories
                  </label>
                  {categories.map((category) => (
                    <label key={category.id} className="properties-filters__radio">
                      <input type="radio" name="category" value={category.slug} defaultChecked={filters.category === category.slug} />
                      {category.name}
                    </label>
                  ))}
                </>
              )}
            </fieldset>

            {/* Capacity before features: a guest knows how many people they
                are travelling with before they know they want a hammock.

                Chips, not number spinners. A stepper asks for two precise taps
                on a 12px arrow to say "four people", and on a phone that arrow
                is smaller than a fingertip. Each of these is a radio, so the
                whole row is one tap, arrow-key navigable, and needs no
                JavaScript at all -- the form is still a plain GET.

                `guests` is the same parameter the homepage search sends, so
                this is the visible copy of it. */}
            {(
              [
                ["Guests", "guests", guestChoices, filters.guestsMin],
                ["Bedrooms", "bedrooms", bedroomChoices, filters.bedroomsMin],
                ["Bathrooms", "bathrooms", bathroomChoices, filters.bathroomsMin],
              ] as const
            ).map(([legend, name, choices, current]) => (
              <fieldset key={name} className="properties-filters__group">
                <legend>{legend}</legend>
                <div className="properties-filters__chips">
                  <label className="properties-filters__chip">
                    <input type="radio" name={name} value="" defaultChecked={!current} />
                    Any
                  </label>
                  {choices.map((count, index) => {
                    const isLast = index === choices.length - 1;
                    return (
                      <label key={count} className="properties-filters__chip">
                        {/* The last chip means "this many or more", so a saved
                            link carrying a bigger number still lands on a
                            selected option instead of silently on none. */}
                        <input
                          type="radio"
                          name={name}
                          value={count}
                          defaultChecked={current != null && (isLast ? current >= count : current === count)}
                        />
                        {count}
                        {isLast ? "+" : ""}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}

            {/* One group, eleven rows. Every amenity used to be its own
                fieldset with its own uppercase legend repeating the checkbox
                label directly underneath it -- eleven headings for eleven
                ticks, and a sidebar the guest had to scroll past to reach the
                numbers that actually narrow a search. */}
            <fieldset className="properties-filters__group">
              <legend>Amenities</legend>
              {amenityFields.map((field) => (
                <label key={field.key} className="properties-filters__checkbox">
                  <input
                    type="checkbox"
                    name={field.key}
                    value="1"
                    defaultChecked={filters.amenities.includes(field.key)}
                  />
                  {field.label}
                </label>
              ))}
            </fieldset>

            <button type="submit" className="properties-filters__submit">
              Filter
            </button>
          </form>
        </PropertyFiltersPanel>

        <div className="properties-results">
          <div className="properties-results__header">
            {/* The "N hidden for your dates" line used to be its own paragraph
                above the keyword form -- 60px of its own on a phone, three
                elements away from the count it qualifies. It belongs on the
                same line as the count. */}
            <p className="properties-results__count">
              {totalCount === 0 ? "No results" : `${totalCount} ${totalCount === 1 ? "property" : "properties"}`}
              {bookedOut > 0 && (
                <span className="properties-results__hidden" title={`${bookedOut} already booked for your dates`}>
                  {" · "}
                  {bookedOut} booked
                </span>
              )}
            </p>
          </div>

          {pageItems.length === 0 ? (
            <p>No properties match your filters.</p>
          ) : (
            buildingGroups.map((group) => (
              <section key={group.building ?? "unassigned"} className="properties-group">
                {/* The heading is what stops a guest enquiring about an
                    apartment in the other building: both are oceanfront, both
                    are in El Zonte, and the photographs look alike. */}
                {showBuildingHeadings && group.building && (
                  <h2 className="properties-group__title">
                    {group.building}
                    <span className="properties-group__count">
                      {countByBuilding.get(group.building ?? "") ?? group.listings.length}{" "}
                      {(countByBuilding.get(group.building ?? "") ?? group.listings.length) === 1 ? "stay" : "stays"}
                    </span>
                  </h2>
                )}
                <div className="listing-grid">
                  {group.listings.map((listing) => {
                const attrs = (listing.attributes as Record<string, string>) ?? {};
                const category = listing.categories[0];
                const summary = buildListingSummary(attrs);
                const town = listingTown(listing.attributes);
                const rate = nightlyRate(attrs);
                /*
                 * The collection, unless the heading immediately above these
                 * cards is already those exact words.
                 *
                 * On this page it always is -- the groups ARE the collections
                 * -- so the line stays hidden here, and the heading does the
                 * job. Rendered anyway it put "BAREFOOT SURF & SAND" on three
                 * cards sitting directly under a "Barefoot Surf & Sand"
                 * heading, next to an "APARTMENTS" pill: three labels on one
                 * card, two of them the same. Where a card has no heading over
                 * it -- Related listings on a property page -- it carries its
                 * own collection instead.
                 */
                const collection = listingBuilding(attrs);
                const showCollection =
                  collection !== null && !(showBuildingHeadings && group.building === collection);
                return (
                  <article key={listing.id} className="listing-card listing-card--archive">
                    <div className="listing-card__media">
                      {listing.featured_media && (
                        <Link href={`/listing/${listing.slug}`}>
                          <Image
                            className="listing-card__thumb"
                            src={mediaPublicUrl(listing.featured_media.storage_path)}
                            width={640}
                            height={420}
                            sizes="(max-width: 640px) 100vw, 50vw"
                            alt={listing.featured_media.alt_text || listing.title}
                            loading="lazy"
                          />
                        </Link>
                      )}
                      {category && (
                        <Link href={`/listing-category/${category.slug}`} className="listing-card__category">
                          {category.name}
                        </Link>
                      )}
                    </div>
                    {showCollection && <p className="listing-card__collection">{collection}</p>}
                    <h3>
                      <Link href={`/listing/${listing.slug}`}>{listing.title}</Link>
                    </h3>
                    {town && (
                      <p className="listing-card__place">
                        <MapPin size={14} strokeWidth={2} aria-hidden="true" />
                        <span>{town}</span>
                      </p>
                    )}
                    {summary.length > 0 && (
                      <p className="listing-summary">
                        {summary.map((item) => (
                          <span key={item.label}>
                            <AmenityIcon type={item.icon} className="listing-summary__icon" />
                            {item.value} {item.label}
                          </span>
                        ))}
                      </p>
                    )}
                    {rate && (
                      <p className="listing-card__price">
                        <strong>{rate}</strong>{" "}
                        <span className="listing-card__price-unit">per night</span>
                      </p>
                    )}
                  </article>
                );
                  })}
                </div>
              </section>
            ))
          )}

          {totalPages > 1 && (
            <nav className="properties-pagination" aria-label="Properties pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                <Link
                  key={pageNumber}
                  href={buildHref(basePath, searchParams, { page: pageNumber === 1 ? undefined : String(pageNumber) })}
                  className={`properties-pagination__link${pageNumber === page ? " properties-pagination__link--active" : ""}`}
                  aria-current={pageNumber === page ? "page" : undefined}
                >
                  {pageNumber}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </>
  );
}
