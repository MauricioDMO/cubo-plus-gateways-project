import { describe, expect, it } from "vitest";

import {
  HOUSE_DEFAULTS,
  applyPreset,
  presetChanges,
  presetFromListing,
  type PresetState,
} from "./listing-presets";

const blank = (over: Partial<PresetState> = {}): PresetState => ({
  values: {},
  checkIn: "",
  checkOut: "",
  minStayNights: "",
  petsTermId: "",
  ...over,
});

describe("HOUSE_DEFAULTS", () => {
  it("carries the terms every property shares, and no price", () => {
    // A house nightly rate does not exist -- the ten properties run from $120
    // to $425 -- so a preset that filled one in would be inventing money.
    expect(HOUSE_DEFAULTS.patch.values?.price).toBeUndefined();
    expect(HOUSE_DEFAULTS.patch.values?.cleaning_fee).toBeUndefined();
    expect(HOUSE_DEFAULTS.patch.values?.tourism_tax).toBe("5");
    expect(HOUSE_DEFAULTS.patch.values?.pet_fee).toBe("100");
    expect(HOUSE_DEFAULTS.patch.checkIn).toBe("15:00");
    expect(HOUSE_DEFAULTS.patch.checkOut).toBe("11:00");
    expect(HOUSE_DEFAULTS.patch.minStayNights).toBe("2");
  });

  it("fills an empty form without leaving a policy unset", () => {
    const next = applyPreset(blank(), HOUSE_DEFAULTS.patch);
    expect(next.values.tourism_tax).toBe("5");
    expect(next.values.pet_fee).toBe("100");
    expect(next.checkIn).toBe("15:00");
    expect(next.minStayNights).toBe("2");
  });
});

describe("presetFromListing", () => {
  it("reads the times back out of seconds", () => {
    const preset = presetFromListing({
      id: 4,
      title: "Golden Hour Getaway",
      attributes: { price: "187", check_in: "54000", check_out: "39600", booking_min_length: "2" },
      pets_term_id: 15,
    });
    expect(preset.patch.checkIn).toBe("15:00");
    expect(preset.patch.checkOut).toBe("11:00");
    expect(preset.patch.minStayNights).toBe("2");
    expect(preset.patch.petsTermId).toBe("15");
    expect(preset.patch.values?.price).toBe("187");
  });

  it("copies an absent fee as absent, not as 'leave it alone'", () => {
    // "The same terms as Golden Hour" has to mean the same terms whatever was
    // typed in first, or the button means something different every time.
    const preset = presetFromListing({
      id: 4,
      title: "Golden Hour Getaway",
      attributes: { price: "187" },
      pets_term_id: null,
    });
    const next = applyPreset(blank({ values: { cleaning_fee: "101.70" } }), preset.patch);
    expect(next.values.cleaning_fee).toBe("");
  });

  it("never touches the title, capacity or the address", () => {
    const preset = presetFromListing({
      id: 6,
      title: "Sunset Surf Getaway",
      attributes: { price: "425", guests: "6", bedrooms: "3", location: "El Zonte, La Libertad", building: "X" },
      pets_term_id: null,
    });
    const next = applyPreset(
      blank({ values: { guests: "2", bedrooms: "1", location: "Xanadu, La Libertad" } }),
      preset.patch
    );
    expect(next.values.guests).toBe("2");
    expect(next.values.bedrooms).toBe("1");
    expect(next.values.location).toBe("Xanadu, La Libertad");
    expect(next.values.price).toBe("425");
  });

  it("survives attributes being null", () => {
    const preset = presetFromListing({ id: 9, title: "Good Waves", attributes: null, pets_term_id: null });
    expect(preset.patch.checkIn).toBe("");
    expect(preset.patch.values?.price).toBe("");
  });
});

describe("presetChanges", () => {
  it("lists only what would really change, with both values", () => {
    const changes = presetChanges(
      blank({ values: { price: "187", tourism_tax: "5" }, checkIn: "15:00" }),
      { values: { price: "425", tourism_tax: "5" }, checkIn: "15:00", checkOut: "11:00" }
    );
    expect(changes.map((c) => c.field)).toEqual(["price", "checkOut"]);
    expect(changes[0]).toMatchObject({ label: "Price per night", from: "$187", to: "$425" });
    expect(changes[1]).toMatchObject({ from: "empty", to: "11:00" });
  });

  it("is empty when the preset matches, which is the answer to 'did it work?'", () => {
    const state = applyPreset(blank(), HOUSE_DEFAULTS.patch);
    expect(presetChanges(state, HOUSE_DEFAULTS.patch)).toEqual([]);
  });

  it("says 'no minimum' rather than showing an empty minimum stay", () => {
    const changes = presetChanges(blank({ minStayNights: "3" }), { minStayNights: "" });
    expect(changes[0]).toMatchObject({ label: "Minimum stay", from: "3 nights", to: "no minimum" });
  });

  it("names the pets term instead of showing its id", () => {
    const changes = presetChanges(blank(), { petsTermId: "15" }, (id) => (id === "15" ? "Pets allowed" : id));
    expect(changes[0]).toMatchObject({ label: "Pets", from: "empty", to: "Pets allowed" });
  });

  it("ignores whitespace, so a stray space is not a change", () => {
    expect(presetChanges(blank({ values: { pet_fee: " 100 " } }), { values: { pet_fee: "100" } })).toEqual([]);
  });
});
