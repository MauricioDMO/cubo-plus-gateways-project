import { describe, expect, it } from "vitest";

import { isKnownTaxonomy, TAXONOMIES, taxonomyLabel, taxonomyTermPath } from "./taxonomies";

describe("taxonomies", () => {
  it("covers the three taxonomies the database actually holds", () => {
    expect(TAXONOMIES.map((t) => t.key)).toEqual(["hp_listing_category", "category", "hp_listing_pets"]);
  });

  it("labels the internal names in words an operator uses", () => {
    expect(taxonomyLabel("hp_listing_category")).toBe("Property categories");
    expect(taxonomyLabel("category")).toBe("Blog categories");
    // An unknown taxonomy shows its raw key rather than an empty cell: seeing
    // "hp_something" is how you find out a screen is missing.
    expect(taxonomyLabel("hp_something")).toBe("hp_something");
  });

  it("gates creation to the taxonomies the UI can label", () => {
    // The API uses this. A row created under an unlabelled taxonomy would
    // appear on no screen and be findable only in SQL.
    expect(isKnownTaxonomy("category")).toBe(true);
    expect(isKnownTaxonomy("hp_listing_pets")).toBe(true);
    expect(isKnownTaxonomy("post_tag")).toBe(false);
    expect(isKnownTaxonomy("")).toBe(false);
  });

  it("knows where a term is published, and where it is not", () => {
    expect(taxonomyTermPath("hp_listing_category", "apartments")).toBe("/listing-category/apartments");
    expect(taxonomyTermPath("category", "getaways-guides")).toBe("/category/getaways-guides");
    // Pet policies are filter options, not pages. Linking them would produce
    // a 404 next to every row.
    expect(taxonomyTermPath("hp_listing_pets", "allowed")).toBeNull();
    expect(taxonomyTermPath("post_tag", "surf")).toBeNull();
  });
});
