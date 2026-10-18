import { describe, expect, it } from "vitest";

import { isListingActive, withListingActive, LISTING_ACTIVE_KEY } from "./listing-visibility";

describe("isListingActive", () => {
  it("treats an absent flag as visible", () => {
    // The ten listings that existed before this feature have no such key.
    // Defaulting the other way would have emptied the site on deploy.
    expect(isListingActive({})).toBe(true);
    expect(isListingActive(null)).toBe(true);
    expect(isListingActive(undefined)).toBe(true);
  });

  it("hides on any recognised off value", () => {
    for (const off of ["false", "FALSE", " false ", "0", "no", "off"]) {
      expect(isListingActive({ [LISTING_ACTIVE_KEY]: off }), off).toBe(false);
    }
  });

  it("stays visible on anything it does not recognise", () => {
    // A typo in the attributes bag must not silently unpublish a property
    // that is earning money.
    for (const value of ["true", "1", "yes", "maybe", "flase", ""]) {
      expect(isListingActive({ [LISTING_ACTIVE_KEY]: value }), value).toBe(true);
    }
  });
});

describe("withListingActive", () => {
  it("stores visible as an absent key", () => {
    expect(withListingActive({ [LISTING_ACTIVE_KEY]: "false", price: "300" }, true)).toEqual({ price: "300" });
  });

  it("writes the off value and keeps everything else", () => {
    expect(withListingActive({ price: "300" }, false)).toEqual({ price: "300", [LISTING_ACTIVE_KEY]: "false" });
  });

  it("does not mutate the attributes it is given", () => {
    const attrs = { price: "300" };
    withListingActive(attrs, false);
    expect(attrs).toEqual({ price: "300" });
  });

  it("round-trips through the reader", () => {
    expect(isListingActive(withListingActive({}, false))).toBe(false);
    expect(isListingActive(withListingActive(withListingActive({}, false), true))).toBe(true);
  });
});
