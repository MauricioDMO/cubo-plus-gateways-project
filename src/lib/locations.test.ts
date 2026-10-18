import { describe, expect, it } from "vitest";
import {
  collectDestinations,
  destinationSlug,
  listingLocation,
  listingTown,
  matchesDestination,
} from "./locations";

describe("destinationSlug", () => {
  it("turns an admin-typed location into a stable url key", () => {
    expect(destinationSlug("El Zonte, La Libertad")).toBe("el-zonte-la-libertad");
  });

  it("collapses casing, punctuation and accents so one town stays one destination", () => {
    const variants = [
      "El Zonte, La Libertad",
      "el zonte, la libertad",
      "  El  Zonte , La Libertad  ",
      "El Zonté, La Libertad",
    ];
    const slugs = new Set(variants.map(destinationSlug));
    expect([...slugs]).toEqual(["el-zonte-la-libertad"]);
  });

  it("leaves no leading or trailing separator", () => {
    expect(destinationSlug("  ,Xanadu,  ")).toBe("xanadu");
  });
});

describe("listingLocation", () => {
  it("reads the location attribute", () => {
    expect(listingLocation({ location: "Xanadu, La Libertad" })).toBe("Xanadu, La Libertad");
  });

  it("treats blank and missing alike", () => {
    expect(listingLocation({ location: "   " })).toBeNull();
    expect(listingLocation({})).toBeNull();
    expect(listingLocation(null)).toBeNull();
  });
});

describe("listingTown", () => {
  it("keeps the town and drops the department", () => {
    expect(listingTown({ location: "El Zonte, La Libertad" })).toBe("El Zonte");
  });

  it("returns a one-part location unchanged", () => {
    expect(listingTown({ location: "El Tunco" })).toBe("El Tunco");
  });

  it("is null when there is no location, rather than an empty line on a card", () => {
    expect(listingTown({})).toBeNull();
    expect(listingTown({ location: " , La Libertad" })).toBeNull();
  });
});

describe("collectDestinations", () => {
  const listings = [
    { attributes: { location: "El Zonte, La Libertad" } },
    { attributes: { location: "el zonte, la libertad" } },
    { attributes: { location: "Xanadu, La Libertad" } },
    { attributes: {} },
    { attributes: null },
  ];

  it("groups spelling variants into a single destination", () => {
    const destinations = collectDestinations(listings);
    expect(destinations).toHaveLength(2);
    expect(destinations[0]).toMatchObject({ slug: "el-zonte-la-libertad", count: 2 });
  });

  it("orders by how many properties each destination has", () => {
    expect(collectDestinations(listings).map((d) => d.slug)).toEqual([
      "el-zonte-la-libertad",
      "xanadu-la-libertad",
    ]);
  });

  it("keeps the label as first typed rather than the slug", () => {
    expect(collectDestinations(listings)[0].label).toBe("El Zonte, La Libertad");
  });

  it("skips listings with no location instead of inventing a blank destination", () => {
    expect(collectDestinations([{ attributes: {} }, { attributes: null }])).toEqual([]);
  });
});

describe("matchesDestination", () => {
  it("matches on the slug, so a query survives punctuation differences", () => {
    expect(matchesDestination({ location: "El Zonte, La Libertad" }, "el-zonte-la-libertad")).toBe(true);
    expect(matchesDestination({ location: "El Zonte, La Libertad" }, "El Zonte, La Libertad")).toBe(true);
  });

  it("does not match a different town", () => {
    expect(matchesDestination({ location: "Xanadu, La Libertad" }, "el-zonte-la-libertad")).toBe(false);
  });

  it("never matches a listing that has no location recorded", () => {
    expect(matchesDestination({}, "el-zonte-la-libertad")).toBe(false);
  });
});
