import { describe, expect, it } from "vitest";

import { groupByBuilding, listingBuilding } from "./listing-buildings";

const listing = (id: number, building?: string) => ({
  id,
  attributes: building == null ? { price: "300" } : { price: "300", building },
});

describe("listingBuilding", () => {
  it("reads the name, and treats blank as absent", () => {
    expect(listingBuilding({ building: "Zonset Surf Residences" })).toBe("Zonset Surf Residences");
    expect(listingBuilding({ building: "  Barefoot Surf & Sand  " })).toBe("Barefoot Surf & Sand");
    expect(listingBuilding({ building: "   " })).toBeNull();
    expect(listingBuilding({})).toBeNull();
    expect(listingBuilding(null)).toBeNull();
  });
});

describe("groupByBuilding", () => {
  it("groups by building and keeps the incoming order inside each group", () => {
    // The order is whatever sort the guest chose. Grouping is not allowed to
    // reorder a "price, low to high" result.
    const groups = groupByBuilding([
      listing(1, "Zonset Surf Residences"),
      listing(2, "Barefoot Surf & Sand"),
      listing(3, "Zonset Surf Residences"),
    ]);
    expect(groups.map((group) => group.building)).toEqual(["Zonset Surf Residences", "Barefoot Surf & Sand"]);
    expect(groups[0].listings.map((l) => l.id)).toEqual([1, 3]);
    expect(groups[1].listings.map((l) => l.id)).toEqual([2]);
  });

  it("folds case and spacing differences into one group", () => {
    const groups = groupByBuilding([listing(1, "Barefoot Surf & Sand"), listing(2, "barefoot  surf & sand")]);
    expect(groups).toHaveLength(1);
    // The first spelling wins the label -- a hand-typed variant should not
    // rename the heading for the whole building.
    expect(groups[0].building).toBe("Barefoot Surf & Sand");
    expect(groups[0].listings).toHaveLength(2);
  });

  it("puts the properties with no building last, in one unnamed group", () => {
    const groups = groupByBuilding([listing(1), listing(2, "Zonset Surf Residences"), listing(3)]);
    expect(groups.map((group) => group.building)).toEqual(["Zonset Surf Residences", null]);
    expect(groups[1].listings.map((l) => l.id)).toEqual([1, 3]);
  });

  it("loses nothing", () => {
    const input = [listing(1, "A"), listing(2), listing(3, "B"), listing(4, "A")];
    expect(groupByBuilding(input).flatMap((group) => group.listings)).toHaveLength(input.length);
  });

  it("returns no groups for no listings", () => {
    expect(groupByBuilding([])).toEqual([]);
  });
});
