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
        <div className="flex items-center flex-wrap gap-y-2.5 gap-x-3.5 mb-4.5 bg-[rgba(15,_23,_39,_0.03)] px-4.5 py-3.5 rounded-[8px] max-[860.001px]:mb-3
          max-[860.001px]:px-3 max-[860.001px]:py-2.5 max-[860.001px]:gap-2">
          <span className="text-[11px] font-bold tracking-[1px] uppercase text-muted-text max-[860.001px]:hidden">Your search</span>
          <ul className="flex flex-wrap list-none m-0 p-0 gap-2 [&_li]:bg-background [&_li]:text-[13px] [&_li]:text-text [&_li]:px-3 [&_li]:py-1.25
            [&_li]:rounded-full [&_li]:border [&_li]:border-solid [&_li]:border-border max-[860.001px]:flex-nowrap
            max-[860.001px]:overflow-x-auto max-[860.001px]:[scrollbar-width:none] max-[860.001px]:pb-0.5
            [&::-webkit-scrollbar]:max-[860.001px]:hidden [&_li]:max-[860.001px]:flex-none [&_li]:max-[860.001px]:whitespace-nowrap">
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
            <li className="max-[860.001px]:bg-transparent max-[860.001px]:border-[transparent] [&_a]:max-[860.001px]:text-link-strong">
              <Link href={basePath}>Clear</Link>
            </li>
          </ul>
        </div>
      )}
      <div className="grid grid-cols-[300px_minmax(0,_1fr)] items-start mt-0 gap-[clamp(34px,_4vw,_58px)] max-[860.001px]:grid-cols-1
        max-[860.001px]:gap-3">
        <PropertyFiltersPanel activeFilterCount={activeFilterCount}>
          <form method="get" action={basePath}>
            {/* Without these the sidebar's "Filter" button would throw away
                the destination, dates and party size the guest arrived with. */}
            {SEARCH_PARAM_KEYS.map((key) => {
              const value = firstParam(searchParams[key]);
              return value ? <input key={key} type="hidden" name={key} value={value} /> : null;
            })}

            <fieldset className="border-t-0 border-r-0 border-b border-solid border-b-border border-l-0 pt-0 pb-4.5 m-0 px-0 [&_legend]:text-[11px]
              [&_legend]:font-bold [&_legend]:uppercase [&_legend]:tracking-[0.04em] [&_legend]:text-muted-text [&_legend]:mb-1.5 [&_legend]:p-0
              [&_input[type=number]]:w-full [&_input[type=number]]:[font-family:inherit] [&_input[type=number]]:text-[14px]
              [&_input[type=number]]:[font-weight:inherit] [&_input[type=number]]:[font-style:inherit] [&_input[type=number]]:leading-[inherit]
              [&_input[type=number]]:[font-variant:inherit] [&_input[type=number]]:text-body-text [&_input[type=number]]:bg-background
              [&_input[type=number]]:px-2.5 [&_input[type=number]]:py-2 [&_input[type=number]]:rounded-[6px] [&_input[type=number]]:border
              [&_input[type=number]]:border-solid [&_input[type=number]]:border-[rgba(15,_23,_39,_0.14)] [&_select]:w-full
              [&_select]:[font-family:inherit] [&_select]:text-[14px] [&_select]:[font-weight:inherit] [&_select]:[font-style:inherit]
              [&_select]:leading-[inherit] [&_select]:[font-variant:inherit] [&_select]:text-body-text [&_select]:bg-background [&_select]:px-2.5
              [&_select]:py-2 [&_select]:rounded-[6px] [&_select]:border [&_select]:border-solid [&_select]:border-[rgba(15,_23,_39,_0.14)]">
              <legend>Category</legend>
              {categoryLinks ? (
                <>
                  <Link
                    href="/properties"
                    className={`flex items-center text-[14px] text-body-text no-underline px-0 py-0.5 gap-2 ${!activeCategorySlug ? " properties-filters__radio--active [&&]:text-heading [&&]:font-semibold" : ""}`}
                  >
                    <span className="shrink-0 w-3.5 h-3.5 rounded-full border border-solid border-[rgba(15,_23,_39,_0.3)]
                      [.properties-filters\_\_radio--active_&]:bg-button-bg
                      [.properties-filters\_\_radio--active_&]:shadow-[inset_0_0_0_2px_var(--color-background)]
                      [.properties-filters\_\_radio--active_&]:border-button-bg" aria-hidden="true" />
                    All Categories
                  </Link>
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/listing-category/${category.slug}`}
                      className={`flex items-center text-[14px] text-body-text no-underline px-0 py-0.5 gap-2 ${activeCategorySlug === category.slug ? " properties-filters__radio--active [&&]:text-heading [&&]:font-semibold" : ""}`}
                    >
                      <span className="shrink-0 w-3.5 h-3.5 rounded-full border border-solid border-[rgba(15,_23,_39,_0.3)]
                        [.properties-filters\_\_radio--active_&]:bg-button-bg
                        [.properties-filters\_\_radio--active_&]:shadow-[inset_0_0_0_2px_var(--color-background)]
                        [.properties-filters\_\_radio--active_&]:border-button-bg" aria-hidden="true" />
                      {category.name}
                    </Link>
                  ))}
                </>
              ) : (
                <>
                  <label className="flex items-center text-[14px] text-body-text no-underline px-0 py-0.5 gap-2">
                    <input type="radio" name="category" value="" defaultChecked={!filters.category} />
                    All Categories
                  </label>
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center text-[14px] text-body-text no-underline px-0 py-0.5 gap-2">
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
              <fieldset key={name} className="border-t-0 border-r-0 border-b border-solid border-b-border border-l-0 pt-0 pb-4.5 m-0 px-0 [&_legend]:text-[11px]
                [&_legend]:font-bold [&_legend]:uppercase [&_legend]:tracking-[0.04em] [&_legend]:text-muted-text [&_legend]:mb-1.5 [&_legend]:p-0
                [&_input[type=number]]:w-full [&_input[type=number]]:[font-family:inherit] [&_input[type=number]]:text-[14px]
                [&_input[type=number]]:[font-weight:inherit] [&_input[type=number]]:[font-style:inherit] [&_input[type=number]]:leading-[inherit]
                [&_input[type=number]]:[font-variant:inherit] [&_input[type=number]]:text-body-text [&_input[type=number]]:bg-background
                [&_input[type=number]]:px-2.5 [&_input[type=number]]:py-2 [&_input[type=number]]:rounded-[6px] [&_input[type=number]]:border
                [&_input[type=number]]:border-solid [&_input[type=number]]:border-[rgba(15,_23,_39,_0.14)] [&_select]:w-full
                [&_select]:[font-family:inherit] [&_select]:text-[14px] [&_select]:[font-weight:inherit] [&_select]:[font-style:inherit]
                [&_select]:leading-[inherit] [&_select]:[font-variant:inherit] [&_select]:text-body-text [&_select]:bg-background [&_select]:px-2.5
                [&_select]:py-2 [&_select]:rounded-[6px] [&_select]:border [&_select]:border-solid [&_select]:border-[rgba(15,_23,_39,_0.14)]">
                <legend>{legend}</legend>
                <div className="flex flex-wrap mt-0.5 gap-1.5">
                  <label className="relative inline-flex items-center justify-center min-w-9.5 h-8.5 text-[13px] text-body-text cursor-pointer select-none
                    [transition:border-color_0.15s_ease,_background-color_0.15s_ease,_color_0.15s_ease] px-2.5 py-0 rounded-full border border-solid
                    border-border [&_input]:absolute [&_input]:top-[50%] [&_input]:left-[50%] [&_input]:w-0.25 [&_input]:h-0.25 [&_input]:opacity-0
                    [&_input]:cursor-pointer [&_input]:m-0 hover:border-heading [&:has(input:checked)]:bg-heading [&:has(input:checked)]:text-white
                    [&:has(input:checked)]:font-semibold [&:has(input:checked)]:border-heading
                    [&:has(input:focus-visible)]:[outline:2px_solid_var(--color-heading)] [&:has(input:focus-visible)]:outline-offset-[2px]">
                    <input type="radio" name={name} value="" defaultChecked={!current} />
                    Any
                  </label>
                  {choices.map((count, index) => {
                    const isLast = index === choices.length - 1;
                    return (
                      <label key={count} className="relative inline-flex items-center justify-center min-w-9.5 h-8.5 text-[13px] text-body-text cursor-pointer select-none
                        [transition:border-color_0.15s_ease,_background-color_0.15s_ease,_color_0.15s_ease] px-2.5 py-0 rounded-full border border-solid
                        border-border [&_input]:absolute [&_input]:top-[50%] [&_input]:left-[50%] [&_input]:w-0.25 [&_input]:h-0.25 [&_input]:opacity-0
                        [&_input]:cursor-pointer [&_input]:m-0 hover:border-heading [&:has(input:checked)]:bg-heading [&:has(input:checked)]:text-white
                        [&:has(input:checked)]:font-semibold [&:has(input:checked)]:border-heading
                        [&:has(input:focus-visible)]:[outline:2px_solid_var(--color-heading)] [&:has(input:focus-visible)]:outline-offset-[2px]">
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
            <fieldset className="border-t-0 border-r-0 border-b border-solid border-b-border border-l-0 pt-0 pb-4.5 m-0 px-0 [&_legend]:text-[11px]
              [&_legend]:font-bold [&_legend]:uppercase [&_legend]:tracking-[0.04em] [&_legend]:text-muted-text [&_legend]:mb-1.5 [&_legend]:p-0
              [&_input[type=number]]:w-full [&_input[type=number]]:[font-family:inherit] [&_input[type=number]]:text-[14px]
              [&_input[type=number]]:[font-weight:inherit] [&_input[type=number]]:[font-style:inherit] [&_input[type=number]]:leading-[inherit]
              [&_input[type=number]]:[font-variant:inherit] [&_input[type=number]]:text-body-text [&_input[type=number]]:bg-background
              [&_input[type=number]]:px-2.5 [&_input[type=number]]:py-2 [&_input[type=number]]:rounded-[6px] [&_input[type=number]]:border
              [&_input[type=number]]:border-solid [&_input[type=number]]:border-[rgba(15,_23,_39,_0.14)] [&_select]:w-full
              [&_select]:[font-family:inherit] [&_select]:text-[14px] [&_select]:[font-weight:inherit] [&_select]:[font-style:inherit]
              [&_select]:leading-[inherit] [&_select]:[font-variant:inherit] [&_select]:text-body-text [&_select]:bg-background [&_select]:px-2.5
              [&_select]:py-2 [&_select]:rounded-[6px] [&_select]:border [&_select]:border-solid [&_select]:border-[rgba(15,_23,_39,_0.14)]">
              <legend>Amenities</legend>
              {amenityFields.map((field) => (
                <label key={field.key} className="flex items-center text-[14px] text-body-text no-underline px-0 py-0.5 gap-2">
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

            <button type="submit" className="inline-flex items-center justify-center self-stretch bg-button-bg text-button-text [font-family:inherit] [font-size:inherit]
              font-semibold [font-style:inherit] leading-[inherit] [font-variant:inherit] cursor-pointer
              shadow-[0_14px_26px_rgba(7,_36,_86,_0.18)] px-6 py-3.75 rounded-full border-0">
              Filter
            </button>
          </form>
        </PropertyFiltersPanel>

        <div className="properties-results w-full max-[860.001px]:w-full max-[860.001px]:min-w-0
          [.properties-filters:not([data-open=true])+&]:max-[860.001px]:mt-0">
          <div className="flex items-center justify-between flex-wrap w-full mb-7 gap-4
            max-[860.001px]:flex max-[860.001px]:flex-row max-[860.001px]:items-center max-[860.001px]:justify-between
            max-[860.001px]:mt-3.5 max-[860.001px]:mb-3 max-[860.001px]:flex-nowrap max-[860.001px]:mx-0 max-[860.001px]:gap-3">
            {/* The "N hidden for your dates" line used to be its own paragraph
                above the keyword form -- 60px of its own on a phone, three
                elements away from the count it qualifies. It belongs on the
                same line as the count. */}
            <p className="text-[13px] uppercase tracking-[0.04em] text-muted-text m-0 max-[860.001px]:text-[13px] max-[860.001px]:min-w-0
              max-[860.001px]:overflow-hidden max-[860.001px]:text-ellipsis max-[860.001px]:whitespace-nowrap max-[860.001px]:normal-case
              max-[860.001px]:tracking-[0]">
              {totalCount === 0 ? "No results" : `${totalCount} ${totalCount === 1 ? "property" : "properties"}`}
              {bookedOut > 0 && (
                <span className="max-[860.001px]:text-muted-text" title={`${bookedOut} already booked for your dates`}>
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
              <section key={group.building ?? "unassigned"} className="properties-group [.properties-group+&]:mt-8.5">
                {/* The heading is what stops a guest enquiring about an
                    apartment in the other building: both are oceanfront, both
                    are in El Zonte, and the photographs look alike. */}
                {showBuildingHeadings && group.building && (
                  <h2 className="flex items-baseline mt-0 mb-4 text-[20px] leading-[1.3] text-heading mx-0 gap-2.5">
                    {group.building}
                    <span className="text-[13px] font-normal text-body-text">
                      {countByBuilding.get(group.building ?? "") ?? group.listings.length}{" "}
                      {(countByBuilding.get(group.building ?? "") ?? group.listings.length) === 1 ? "stay" : "stays"}
                    </span>
                  </h2>
                )}
                <div className="grid grid-cols-3 mx-0 my-6 gap-6 max-[960.001px]:grid-cols-2 max-[640.001px]:grid-cols-1
                  [.related-listings_&]:grid-cols-[repeat(auto-fill,_minmax(250px,_1fr))] [.related-listings_&]:m-0 [.related-listings_&]:gap-7.5
                  [.properties-results_&]:grid-cols-[repeat(auto-fill,_minmax(250px,_1fr))] [.properties-results_&]:gap-y-8.5
                  [.properties-results_&]:gap-x-8 [.properties-results_&]:m-0 [.properties-results_&]:max-[860.001px]:grid-cols-1">
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
                  <article key={listing.id} className="listing-card shadow-[0_5px_30px_rgba(7,_36,_86,_0.075)] flex flex-col items-start px-6 py-5 rounded-[10px]
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
                      {listing.featured_media && (
                        <Link href={`/listing/${listing.slug}`}>
                          <Image
                            className="block w-[calc(100%_+_48px)] h-40 object-cover rounded-tl-[10px] rounded-tr-[10px] rounded-br-[0] rounded-bl-[0] mt-[-20px] mb-4
                              mx-[-24px] [.properties-results_&]:w-full [.properties-results_&]:h-[clamp(210px,_18vw,_260px)]
                              [.properties-results_&]:[transition:transform_450ms_cubic-bezier(0.22,_1,_0.36,_1)] [.properties-results_&]:m-0
                              [.properties-results_&]:rounded-[0] [.related-listings_&]:w-full [.related-listings_&]:h-[clamp(210px,_18vw,_260px)]
                              [.related-listings_&]:[transition:transform_450ms_cubic-bezier(0.22,_1,_0.36,_1)] [.related-listings_&]:m-0
                              [.related-listings_&]:rounded-[0] [.properties-results_.listing-card:hover_&]:[transform:scale(1.035)]
                              [.related-listings_.listing-card:hover_&]:[transform:scale(1.035)]
                              [.properties-results_&]:max-[860.001px]:h-[clamp(220px,_56vw,_360px)]"
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
                        <Link href={`/listing-category/${category.slug}`} className="absolute left-6 bottom-4 z-[1] inline-block bg-[rgba(255,_255,_255,_0.35)] text-white text-[11px] font-normal uppercase
                          tracking-[0.04em] no-underline px-3 py-1.5 rounded-full [.properties-results_&]:left-7.5 [.properties-results_&]:bottom-5.5
                          [.properties-results_&]:bg-[rgba(246,_248,_245,_0.78)] [.properties-results_&]:text-button-bg [.properties-results_&]:text-[11px]
                          [.properties-results_&]:font-extrabold [.related-listings_&]:left-7.5 [.related-listings_&]:bottom-5.5
                          [.related-listings_&]:bg-[rgba(246,_248,_245,_0.78)] [.related-listings_&]:text-button-bg [.related-listings_&]:text-[11px]
                          [.related-listings_&]:font-extrabold [.properties-results_&]:max-[560.001px]:left-5">
                          {category.name}
                        </Link>
                      )}
                    </div>
                    {showCollection && <p className="listing-card__collection mt-3.5 mb-0.5 text-[10.5px] font-extrabold tracking-[1px] uppercase text-muted-text mx-0">{collection}</p>}
                    <h3>
                      <Link href={`/listing/${listing.slug}`}>{listing.title}</Link>
                    </h3>
                    {town && (
                      <p className="flex items-center mt-1.5 mb-0 text-[13.5px] text-body-text mx-0 gap-1.25 [&_svg]:flex-none [&_svg]:text-current">
                        <MapPin size={14} strokeWidth={2} aria-hidden="true" />
                        <span>{town}</span>
                      </p>
                    )}
                    {summary.length > 0 && (
                      <p className="flex flex-wrap items-center mt-2 mb-0 list-none text-body-text text-[14px] leading-[20px] tabular-nums min-h-5 mx-0 p-0
                        [&>span]:inline-flex [&>span]:items-center [&>span]:whitespace-nowrap [&>span]:gap-1 [&>span+span::before]:content-['·']
                        [&>span+span::before]:text-muted-text [&>span+span::before]:mx-1.5 [&>span+span::before]:my-0
                        [.listing-card_&]:max-[640.001px]:grid [.listing-card_&]:max-[640.001px]:grid-cols-2 [.listing-card_&]:max-[640.001px]:gap-y-1
                        [.listing-card_&]:max-[640.001px]:gap-x-2.5 [.listing-card_&>span+span::before]:max-[640.001px]:content-[none]">
                        {summary.map((item) => (
                          <span key={item.label}>
                            <AmenityIcon type={item.icon} className="grow-0 shrink-0 basis-4 w-4 h-4 text-muted-text" />
                            {item.value} {item.label}
                          </span>
                        ))}
                      </p>
                    )}
                    {rate && (
                      <p className="flex items-baseline mt-2.5 mb-0 font-heading text-heading mx-0 gap-1.25 [&_strong]:text-[19px] [&_strong]:font-semibold
                        [&_strong]:tabular-nums">
                        <strong>{rate}</strong>{" "}
                        <span className="font-body text-[13px] font-normal text-muted-text">per night</span>
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
            <nav className="flex mt-8 gap-2" aria-label="Properties pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                <Link
                  key={pageNumber}
                  href={buildHref(basePath, searchParams, { page: pageNumber === 1 ? undefined : String(pageNumber) })}
                  className={`inline-flex items-center justify-center min-w-9 h-9 text-body-text no-underline text-[14px] px-2 py-0 rounded-[6px] border border-solid border-border ${pageNumber === page ? " [&&]:bg-button-bg [&&]:text-button-text [&&]:border-button-bg" : ""}`}
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
