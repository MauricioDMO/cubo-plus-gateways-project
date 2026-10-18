import { describe, expect, it } from "vitest";
import {
  filterListings,
  paginate,
  parseArchiveFilters,
  parseArchivePage,
  type ArchiveListing,
} from "@/modules/listings/properties-filter";

function listing(overrides: Partial<ArchiveListing> & { attributes: Record<string, string> }): ArchiveListing {
  return {
    id: 1,
    title: "Untitled",
    categories: [],
    ...overrides,
  };
}

describe("parseArchiveFilters", () => {
  it("reads category, checked amenities, numeric minimums, and pets", () => {
    const filters = parseArchiveFilters(
      { category: "apartments", beachaccess: "1", elevator: "0", parking_min: "1", bedrooms: "2", bathrooms: "1", pets: "not-allowed" },
      ["beachaccess", "elevator"]
    );
    expect(filters).toEqual({
      category: "apartments",
      amenities: ["beachaccess"],
      parkingMin: 1,
      bedroomsMin: 2,
      bathroomsMin: 1,
      petsSlug: "not-allowed",
    });
  });

  it("omits zero/absent numeric filters and pets", () => {
    const filters = parseArchiveFilters({}, ["beachaccess"]);
    expect(filters).toEqual({
      category: undefined,
      amenities: [],
      parkingMin: undefined,
      bedroomsMin: undefined,
      bathroomsMin: undefined,
      petsSlug: undefined,
    });
  });
});

describe("parseArchivePage", () => {
  it("falls back to page 1 for unknown or missing values", () => {
    expect(parseArchivePage({})).toBe(1);
    expect(parseArchivePage({ page: "0" })).toBe(1);
    expect(parseArchivePage({ page: "3" })).toBe(3);
  });
});

describe("filterListings", () => {
  const villa = listing({ id: 1, title: "Villa", categories: [{ id: 1, name: "Villas", slug: "villas" }], attributes: { beachaccess: "1", bedrooms: "3" } });
  const apartment = listing({ id: 2, title: "Apartment", categories: [{ id: 2, name: "Apartments", slug: "apartments" }], attributes: { bedrooms: "1" } });

  it("filters by category slug", () => {
    expect(filterListings([villa, apartment], { category: "villas", amenities: [] })).toEqual([villa]);
  });

  it("filters by building, matched as a slug", () => {
    // Slugs, because "Barefoot Surf & Sand" in a URL is an ampersand and two
    // spaces away from working.
    const zonset = listing({ id: 3, title: "Nomad", attributes: { building: "Zonset Surf Residences" } });
    const barefoot = listing({ id: 4, title: "Solaris", attributes: { building: "Barefoot Surf & Sand" } });
    const house = listing({ id: 5, title: "Casa", attributes: {} });
    const all = [zonset, barefoot, house];
    expect(filterListings(all, { amenities: [], building: "barefoot-surf-sand" })).toEqual([barefoot]);
    expect(filterListings(all, { amenities: [], building: "zonset-surf-residences" })).toEqual([zonset]);
    // A property with no building recorded is not in any building.
    expect(filterListings(all, { amenities: [], building: "anything" })).toEqual([]);
    // And no filter keeps everything, house included.
    expect(filterListings(all, { amenities: [] })).toEqual(all);
  });

  it("filters by required amenity presence", () => {
    expect(filterListings([villa, apartment], { category: undefined, amenities: ["beachaccess"] })).toEqual([villa]);
  });

  it("filters by minimum bedrooms", () => {
    expect(filterListings([villa, apartment], { amenities: [], bedroomsMin: 2 })).toEqual([villa]);
  });

  it("filters by minimum parking", () => {
    const withParking = listing({ id: 3, title: "Parked", attributes: { parking: "2" } });
    expect(filterListings([withParking, apartment], { amenities: [], parkingMin: 1 })).toEqual([withParking]);
  });

  it("filters by exact pets term slug", () => {
    const noPets = listing({ id: 4, title: "No Pets", attributes: {}, petsSlug: "not-allowed" });
    const catsOk = listing({ id: 5, title: "Cats OK", attributes: {}, petsSlug: "cats-only" });
    expect(filterListings([noPets, catsOk], { amenities: [], petsSlug: "not-allowed" })).toEqual([noPets]);
  });

  it("keeps everything when no filters are set", () => {
    expect(filterListings([villa, apartment], { amenities: [] })).toEqual([villa, apartment]);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 10 }, (_, i) => i);

  it("slices the requested page and reports the visible range", () => {
    const result = paginate(items, 2, 6);
    expect(result.pageItems).toEqual([6, 7, 8, 9]);
    expect(result).toMatchObject({ totalCount: 10, totalPages: 2, page: 2, rangeStart: 7, rangeEnd: 10 });
  });

  it("clamps a page number past the end to the last page", () => {
    const result = paginate(items, 99, 6);
    expect(result.page).toBe(2);
    expect(result.pageItems).toEqual([6, 7, 8, 9]);
  });

  it("handles an empty list", () => {
    const result = paginate([], 1, 6);
    expect(result).toMatchObject({ pageItems: [], totalCount: 0, totalPages: 1, page: 1, rangeStart: 0, rangeEnd: 0 });
  });
});

describe("destination and guest filters", () => {
  const listings = [
    {
      id: 1,
      title: "Zonte Surfside",
      attributes: { location: "El Zonte, La Libertad", guests: "4" },
      categories: [],
    },
    {
      id: 2,
      title: "Casa Jungla",
      attributes: { location: "Xanadu, La Libertad", guests: "6" },
      categories: [],
    },
    {
      id: 3,
      title: "No capacity recorded",
      attributes: { location: "El Zonte, La Libertad" },
      categories: [],
    },
  ];

  const filters = (searchParams: Record<string, string>) => parseArchiveFilters(searchParams, []);

  it("keeps only the listings in the requested destination", () => {
    const result = filterListings(listings, filters({ destination: "xanadu-la-libertad" }));
    expect(result.map((l) => l.id)).toEqual([2]);
  });

  it("matches a destination regardless of punctuation and casing", () => {
    const result = filterListings(listings, filters({ destination: "el zonte, la libertad" }));
    expect(result.map((l) => l.id)).toEqual([1, 3]);
  });

  it("drops listings that sleep fewer guests than asked", () => {
    const result = filterListings(listings, filters({ guests: "6" }));
    expect(result.map((l) => l.id)).toEqual([2, 3]);
  });

  it("keeps a listing whose capacity was never filled in rather than hiding it", () => {
    const result = filterListings(listings, filters({ guests: "8" }));
    expect(result.map((l) => l.id)).toEqual([3]);
  });

  it("combines destination and guests", () => {
    const result = filterListings(listings, filters({ destination: "el-zonte-la-libertad", guests: "4" }));
    expect(result.map((l) => l.id)).toEqual([1, 3]);
  });

  it("ignores a zero or negative guest count", () => {
    expect(filters({ guests: "0" }).guestsMin).toBeUndefined();
    expect(filters({ guests: "-2" }).guestsMin).toBeUndefined();
  });
});
