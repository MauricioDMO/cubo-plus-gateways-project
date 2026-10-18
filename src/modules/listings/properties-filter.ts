// Pure filter/pagination logic for the /properties archive
// (app/(site)/properties/page.tsx). Kept separate from the page component so
// it's unit-testable without a Supabase client or Next.js request context.

import { matchesDestination } from "@/modules/listings/locations";
import { listingBuilding } from "@/modules/listings/listing-buildings";
import { slugify } from "@/shared/utils/strings";

export type ArchiveListing = {
  id: number;
  title: string;
  attributes: unknown;
  categories: Array<{ id: number; name: string; slug: string }>;
  petsSlug?: string | null;
};

export type ArchiveFilters = {
  q?: string;
  category?: string;
  amenities: string[];
  parkingMin?: number;
  bedroomsMin?: number;
  bathroomsMin?: number;
  petsSlug?: string;
  /** ?destination= — a slug from modules/listings/locations.ts, matched against attributes.location. */
  destination?: string;
  /**
   * ?building= — a slugified building name, matched against attributes.building.
   *
   * Every apartment is in El Zonte, so the town is not a choice a guest makes
   * any more; the building is. Six are in Zonset Surf Residences and three in
   * Barefoot Surf & Sand, and telling them apart was the whole reason the
   * archive groups by building in the first place.
   */
  building?: string;
  /** ?guests= — party size; keeps listings that sleep at least this many. */
  guestsMin?: number;
};

export type ArchiveSearchParams = Record<string, string | string[] | undefined>;

export const ARCHIVE_PAGE_SIZE = 6;

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// `amenityKeys` is the sidebar's checkbox list (modules/listings/amenities.ts'
// amenityFilterFields, mapped to keys) -- passed in rather than imported so
// this module has no dependency on the amenity table's shape.
export function parseArchiveFilters(searchParams: ArchiveSearchParams, amenityKeys: string[]): ArchiveFilters {
  const q = firstString(searchParams.q)?.trim() || undefined;
  const category = firstString(searchParams.category) || undefined;
  const amenities = amenityKeys.filter((key) => firstString(searchParams[key]) === "1");
  const parkingMin = Number(firstString(searchParams.parking_min));
  const bedroomsMin = Number(firstString(searchParams.bedrooms));
  const bathroomsMin = Number(firstString(searchParams.bathrooms));
  const petsSlug = firstString(searchParams.pets) || undefined;
  const destination = firstString(searchParams.destination)?.trim() || undefined;
  const building = firstString(searchParams.building)?.trim() || undefined;
  const guestsMin = Number(firstString(searchParams.guests));
  return {
    q,
    category,
    amenities,
    parkingMin: Number.isFinite(parkingMin) && parkingMin > 0 ? parkingMin : undefined,
    bedroomsMin: Number.isFinite(bedroomsMin) && bedroomsMin > 0 ? bedroomsMin : undefined,
    bathroomsMin: Number.isFinite(bathroomsMin) && bathroomsMin > 0 ? bathroomsMin : undefined,
    petsSlug,
    destination,
    building,
    guestsMin: Number.isFinite(guestsMin) && guestsMin > 0 ? guestsMin : undefined,
  };
}

export function parseArchivePage(searchParams: ArchiveSearchParams): number {
  const page = Number(firstString(searchParams.page));
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function numericAttr(listing: ArchiveListing, key: string): number {
  const attrs = (listing.attributes as Record<string, string>) ?? {};
  const value = Number(attrs[key]);
  return Number.isFinite(value) ? value : 0;
}

export function filterListings<T extends ArchiveListing>(listings: T[], filters: ArchiveFilters): T[] {
  return listings.filter((listing) => {
    const attrs = (listing.attributes as Record<string, string>) ?? {};
    const keywords = filters.q?.toLowerCase();

    if (keywords) {
      const haystack = [
        listing.title,
        ...listing.categories.map((category) => category.name),
        ...listing.categories.map((category) => category.slug),
        listing.petsSlug ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(keywords)) return false;
    }
    if (filters.category && !listing.categories.some((category) => category.slug === filters.category)) {
      return false;
    }
    for (const key of filters.amenities) {
      if (!(key in attrs)) return false;
    }
    if (filters.destination && !matchesDestination(listing.attributes, filters.destination)) return false;
    // Compared as slugs so the URL survives the ampersand and the spacing in
    // "Barefoot Surf & Sand".
    if (filters.building) {
      const name = listingBuilding(listing.attributes as Record<string, unknown>);
      if (!name || slugify(name) !== filters.building) return false;
    }
    // A listing with no `guests` figure recorded is kept rather than dropped:
    // absent data shouldn't read as "sleeps nobody" and hide a property the
    // owner simply hasn't filled in yet.
    if (filters.guestsMin) {
      const capacity = numericAttr(listing, "guests");
      if (capacity > 0 && capacity < filters.guestsMin) return false;
    }
    if (filters.parkingMin && numericAttr(listing, "parking") < filters.parkingMin) return false;
    if (filters.bedroomsMin && numericAttr(listing, "bedrooms") < filters.bedroomsMin) return false;
    if (filters.bathroomsMin && numericAttr(listing, "bathrooms") < filters.bathroomsMin) return false;
    if (filters.petsSlug && listing.petsSlug !== filters.petsSlug) return false;
    return true;
  });
}

export type PaginationResult<T> = {
  pageItems: T[];
  totalCount: number;
  totalPages: number;
  page: number;
  rangeStart: number;
  rangeEnd: number;
};

export function paginate<T>(items: T[], page: number, pageSize: number): PaginationResult<T> {
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  return {
    pageItems,
    totalCount,
    totalPages,
    page: safePage,
    rangeStart: totalCount === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + pageSize, totalCount),
  };
}
