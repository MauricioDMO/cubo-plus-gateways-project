import { describe, it, expect } from "vitest";
import { buildAmenityRows, buildListingSummary } from "@/modules/listings/amenities";

// Real seeded `attributes` jsonb for the "solaris-3b-3ba-oceanfront-escape-in-surfcity"
// listing (extract/output/listings.json). Deliberately kept in the same
// arbitrary key order the extractor produced, to prove row order comes from
// the amenity table and not from object key order.
const SOLARIS_ATTRS: Record<string, string> = {
  bedrooms: "3",
  bathrooms: "3",
  check_in: "54000",
  check_out: "39600",
  verified: "1",
  booking_min_length: "3",
  airconditioning: "1",
  hotwater: "1",
  tv: "1",
  wifi: "1",
  swimmingpool: "1",
  gym: "1",
  parking: "1",
  oceanview: "1",
  elevator: "1",
  beachaccess: "1",
};

describe("buildAmenityRows", () => {
  it("renders the real site's card order, with no check-in/check-out by default", () => {
    expect(buildAmenityRows(SOLARIS_ATTRS)).toEqual([
      { label: "Beach Access", value: "Yes", icon: "beachaccess" },
      { label: "Elevator", value: "Yes", icon: "elevator" },
      { label: "Ocean View", value: "Yes", icon: "oceanview" },
      { label: "Parking", value: "1", icon: "parking" },
      { label: "Gym", value: "Yes", icon: "gym" },
      { label: "Swimming Pool", value: "Yes", icon: "swimmingpool" },
      { label: "WiFi", value: "Yes", icon: "wifi" },
      { label: "TV", value: "Yes", icon: "tv" },
      { label: "Hot Water", value: "Yes", icon: "hotwater" },
      { label: "Air Conditioning", value: "Yes", icon: "airconditioning" },
      { label: "Bedrooms", value: "3", icon: "bedrooms" },
      { label: "Bathrooms", value: "3", icon: "bathrooms" },
    ]);
  });

  it("appends formatted check-in/check-out when includeCheckTimes is set", () => {
    const rows = buildAmenityRows(SOLARIS_ATTRS, { includeCheckTimes: true });
    expect(rows.slice(-2)).toEqual([
      { label: "Check-in", value: "After 3:00 pm", icon: "check_in", wide: true },
      { label: "Check-out", value: "Before 11:00 am", icon: "check_out", wide: true },
    ]);
  });

  it("omits amenities whose key is absent (HivePress never renders unchecked ones)", () => {
    const rows = buildAmenityRows({ wifi: "1", bedrooms: "1" });
    expect(rows).toEqual([
      { label: "WiFi", value: "Yes", icon: "wifi" },
      { label: "Bedrooms", value: "1", icon: "bedrooms" },
    ]);
  });

  it("shows parking's raw value (spots) rather than coercing it to Yes", () => {
    expect(buildAmenityRows({ parking: "2" })).toEqual([
      { label: "Parking", value: "2", icon: "parking" },
    ]);
  });

  it("ignores non-amenity attributes like verified/booking_min_length/price", () => {
    expect(buildAmenityRows({ verified: "1", booking_min_length: "3", price: "$150" })).toEqual([]);
  });

  it("inserts a Pets row after Bathrooms, before check-in/out, when pets is given", () => {
    const rows = buildAmenityRows(SOLARIS_ATTRS, { includeCheckTimes: true, pets: "Not Allowed" });
    expect(rows.slice(-4)).toEqual([
      { label: "Bathrooms", value: "3", icon: "bathrooms" },
      { label: "Pets", value: "Not Allowed", icon: "pets", wide: true },
      { label: "Check-in", value: "After 3:00 pm", icon: "check_in", wide: true },
      { label: "Check-out", value: "Before 11:00 am", icon: "check_out", wide: true },
    ]);
  });

  it("omits the Pets row when pets is not given", () => {
    expect(buildAmenityRows({ bathrooms: "1" })).toEqual([{ label: "Bathrooms", value: "1", icon: "bathrooms" }]);
  });
});

describe("buildListingSummary", () => {
  it("returns guests, bedrooms and baths in that order", () => {
    expect(buildListingSummary({ bathrooms: "3", guests: "6", bedrooms: "3" })).toEqual([
      { label: "guests", value: 6, icon: "guests" },
      { label: "bedrooms", value: 3, icon: "bedrooms" },
      { label: "baths", value: 3, icon: "bathrooms" },
    ]);
  });

  it("singularises each label at a count of one", () => {
    expect(buildListingSummary({ guests: "1", bedrooms: "1", bathrooms: "1" })).toEqual([
      { label: "guest", value: 1, icon: "guests" },
      { label: "bedroom", value: 1, icon: "bedrooms" },
      { label: "bath", value: 1, icon: "bathrooms" },
    ]);
  });

  // guests is absent from every migrated HivePress listing, so the common case
  // today is a two-item line rather than a missing or zeroed entry.
  it("omits an entry that is missing rather than showing zero", () => {
    expect(buildListingSummary(SOLARIS_ATTRS)).toEqual([
      { label: "bedrooms", value: 3, icon: "bedrooms" },
      { label: "baths", value: 3, icon: "bathrooms" },
    ]);
  });

  it("ignores non-positive and non-numeric values", () => {
    expect(buildListingSummary({ guests: "0", bedrooms: "-2", bathrooms: "n/a" })).toEqual([]);
  });

  it("drops the amenity attributes the cards used to render", () => {
    const labels = buildListingSummary(SOLARIS_ATTRS).map((i) => i.label);
    expect(labels).not.toContain("Beach Access");
    expect(labels).not.toContain("WiFi");
  });
});

describe("the Pets row", () => {
  /*
   * Two sources answered this question and they disagreed on the live site: the
   * imported taxonomy said "Not Allowed" on every listing while the checkout
   * charged $100 for a pet. The fee wins, because it is the side that takes the
   * money.
   */
  it("says Allowed when a fee is charged, whatever the imported term claims", () => {
    const rows = buildAmenityRows({ pet_fee: "100" }, { pets: "Not Allowed" });
    expect(rows).toContainEqual({ label: "Pets", value: "Allowed · $100 per stay", icon: "pets", wide: true });
  });

  it("keeps a refinement that does not contradict the fee", () => {
    const rows = buildAmenityRows({ pet_fee: "100" }, { pets: "Cats Only" });
    expect(rows).toContainEqual({ label: "Pets", value: "Cats Only · $100 per stay", icon: "pets", wide: true });
  });

  it("shows the fee even with no term recorded at all", () => {
    const rows = buildAmenityRows({ pet_fee: "50" }, {});
    expect(rows).toContainEqual({ label: "Pets", value: "Allowed · $50 per stay", icon: "pets", wide: true });
  });

  it("leaves the term alone when there is no fee", () => {
    // A property that genuinely takes no pets still says so.
    const rows = buildAmenityRows({}, { pets: "Not Allowed" });
    expect(rows).toContainEqual({ label: "Pets", value: "Not Allowed", icon: "pets", wide: true });
  });

  it("omits the row entirely when there is neither a fee nor a term", () => {
    const rows = buildAmenityRows({}, {});
    expect(rows.some((row) => row.label === "Pets")).toBe(false);
  });

  it("treats a negative fee as no fee rather than as a charge", () => {
    // The same minus-before-strip trap that turned "-20" into a $20 charge
    // elsewhere: priceFieldsFromAttributes guards it, and this proves the row
    // inherits that guard rather than parsing the number again itself.
    const rows = buildAmenityRows({ pet_fee: "-100" }, { pets: "Not Allowed" });
    expect(rows).toContainEqual({ label: "Pets", value: "Not Allowed", icon: "pets", wide: true });
  });
});
