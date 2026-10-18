import { describe, expect, it } from "vitest";

import {
  ALL_SLOTS,
  applyTokens,
  categoryImageSlotId,
  cleanPlainText,
  CONTENT_GROUPS,
  isAutoSlot,
  isCompleteItem,
  isSafeHref,
  mediaInUse,
  parseList,
  parseSiteContent,
  placeImageSlotId,
  serializeSiteContent,
  slotKindFor,
  slotList,
  slotMediaId,
  slotText,
  type ContentSlot,
} from "@/modules/content/site-content";

const tokens = { stays: "apartments and villas", towns: "El Zonte and Surf City" };
const slot = (id: string): ContentSlot => {
  const found = ALL_SLOTS.find((entry) => entry.id === id);
  if (!found) throw new Error(`no slot ${id}`);
  return found;
};

describe("the round-trip", () => {
  it("gives back what was stored", () => {
    const values = { "home.hero.image": "42", "home.hero.title": "Book direct on the coast" };
    expect(parseSiteContent(serializeSiteContent(values))).toEqual(values);
  });

  it("drops an empty value, because empty means 'use the default'", () => {
    // A cleared field must not write "" over a fallback -- otherwise clearing
    // the hero headline would publish a blank <h1> rather than restoring the
    // built-in one.
    const stored = serializeSiteContent({ "home.hero.title": "   ", "home.tagline": "Kept" });
    expect(parseSiteContent(stored)).toEqual({ "home.tagline": "Kept" });
  });

  it("never throws on a hand-edited row", () => {
    // Every one of these values is read while rendering the front page.
    expect(parseSiteContent("{not json")).toEqual({});
    expect(parseSiteContent("[1,2]")).toEqual({});
    expect(parseSiteContent(null)).toEqual({});
    expect(parseSiteContent('{"home.hero.image":{"nested":true}}')).toEqual({});
  });
});

describe("slotText", () => {
  it("prefers what was set", () => {
    expect(slotText({ "home.hero.title": "Salt air" }, slot("home.hero.title"), tokens)).toBe("Salt air");
  });

  it("falls back to the copy the page shipped with", () => {
    expect(slotText({}, slot("home.hero.title"), tokens)).toBe("Book direct on the coast");
  });

  it("fills the tokens in either case", () => {
    // The point of the tokens: copy written in the admin keeps the property
    // the hardcoded copy had, which is that it cannot name a town the site no
    // longer has a bookable property in.
    expect(slotText({}, slot("home.tagline"), tokens)).toBe(
      "Oceanfront apartments and villas in El Zonte and Surf City, booked direct."
    );
    expect(slotText({ "home.tagline": "{towns} — {stays}" }, slot("home.tagline"), tokens)).toBe(
      "El Zonte and Surf City — apartments and villas"
    );
  });

  it("replaces every occurrence, not just the first", () => {
    expect(applyTokens("{towns} to {towns}", tokens)).toBe("El Zonte and Surf City to El Zonte and Surf City");
  });
});

describe("slotMediaId", () => {
  it("reads a media id back as a number", () => {
    expect(slotMediaId({ "home.hero.image": "42" }, "home.hero.image")).toBe(42);
  });

  it("is null for anything that is not one", () => {
    expect(slotMediaId({}, "home.hero.image")).toBeNull();
    expect(slotMediaId({ "home.hero.image": "0" }, "home.hero.image")).toBeNull();
    expect(slotMediaId({ "home.hero.image": "-3" }, "home.hero.image")).toBeNull();
    expect(slotMediaId({ "home.hero.image": "abc" }, "home.hero.image")).toBeNull();
  });
});

describe("the slot registry", () => {
  it("has no duplicate ids", () => {
    const ids = ALL_SLOTS.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every text slot a default, so a cleared field is never a blank page", () => {
    // Two exceptions, both deliberate. A `derived` slot's default is worked
    // out by the page at render time -- the registry cannot hold "the towns
    // you cover". An `optional` one has no default because empty is the
    // right answer until somebody types the true one: the phone number and
    // the street address are blank so the site never publishes an invented
    // address that contradicts the Google listing.
    for (const entry of ALL_SLOTS.filter(
      (entry) => entry.kind === "text" && !entry.derived && !entry.optional
    )) {
      expect(entry.fallback, entry.id).toBeTruthy();
    }
  });

  it("marks the slots whose empty state is the correct one", () => {
    const optional = ALL_SLOTS.filter((entry) => entry.optional).map((entry) => entry.id);
    expect(optional).toEqual(["business.telephone", "business.streetAddress"]);
  });

  it("puts every slot in exactly one group", () => {
    const grouped = CONTENT_GROUPS.flatMap((group) => group.slots.map((entry) => entry.id));
    expect(grouped.length).toBe(ALL_SLOTS.length);
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  it("keys a place card photo by the card's own key", () => {
    // Whichever tier is showing -- building, town or category -- so an
    // override survives the tier changing under it.
    expect(placeImageSlotId("zonset-surf-residences")).toBe("home.place.zonset-surf-residences.image");
  });

  it("keys a category photo by its slug", () => {
    expect(categoryImageSlotId("apartments")).toBe("home.category.apartments.image");
  });
});

describe("slot kinds", () => {
  it("knows registry slots and generated card photos, and nothing else", () => {
    expect(slotKindFor("about.hero.title")).toBe("text");
    expect(slotKindFor("about.team.members")).toBe("list");
    expect(slotKindFor("home.hero.primaryHref")).toBe("href");
    expect(slotKindFor(placeImageSlotId("zonset-surf-residences"))).toBe("image");
    expect(slotKindFor(categoryImageSlotId("apartments"))).toBe("image");
    expect(slotKindFor("anything.else")).toBeNull();
    expect(slotKindFor("home.place.<script>.image")).toBeNull();
  });

  it("gives every list slot an item schema and a default that reads back complete", () => {
    for (const entry of ALL_SLOTS.filter((candidate) => candidate.kind === "list")) {
      expect(entry.item, entry.id).toBeTruthy();
      const items = slotList({}, entry);
      expect(items.length, entry.id).toBeGreaterThan(0);
      for (const item of items) expect(isCompleteItem(item, entry.item!), `${entry.id}/${item.id}`).toBe(true);
    }
  });

  it("gives every image default a real media id and every link default a safe target", () => {
    for (const entry of ALL_SLOTS.filter((candidate) => candidate.fallbackMediaId != null)) {
      expect(Number.isInteger(entry.fallbackMediaId) && entry.fallbackMediaId! > 0, entry.id).toBe(true);
    }
    for (const entry of ALL_SLOTS.filter((candidate) => candidate.kind === "href")) {
      expect(isSafeHref(entry.fallback ?? ""), entry.id).toBe(true);
    }
  });

  it("says when a slot's words are worked out by the page", () => {
    expect(isAutoSlot({}, "home.hero.eyebrow")).toBe(true); // derived
    expect(isAutoSlot({}, "home.tagline")).toBe(true); // {stays}/{towns}
    expect(isAutoSlot({ "home.tagline": "Fixed now" }, "home.tagline")).toBe(false);
    expect(isAutoSlot({}, "about.hero.title")).toBe(false);
  });
});

describe("isSafeHref", () => {
  it("accepts site paths, http(s), mailto and tel", () => {
    for (const href of ["/about", "/properties?building=zonset", "#team", "https://wa.me/50370000000", "mailto:hi@example.com", "tel:+503 7000 0000"]) {
      expect(isSafeHref(href), href).toBe(true);
    }
  });

  it("refuses anything that runs code or leaves the site in disguise", () => {
    for (const href of ["javascript:alert(1)", "data:text/html,x", "//evil.example", "/\\evil.example", "about", "https://", "/a b", ""]) {
      expect(isSafeHref(href), href).toBe(false);
    }
  });
});

describe("cleanPlainText", () => {
  it("makes one line of it", () => {
    expect(cleanPlainText("  Two\n lines\u0000 here  ")).toBe("Two lines here");
  });
});

describe("lists", () => {
  const schema = { noun: "person", fields: [{ key: "name", kind: "text" as const, label: "Name", required: true }] };

  it("drops what it cannot use instead of throwing", () => {
    const raw = JSON.stringify([{ id: "a", name: "Ana" }, "nope", { name: "no id" }, { id: "a", name: "dupe" }, { id: "b" }]);
    expect(parseList(raw, schema)).toEqual([
      { id: "a", name: "Ana" },
      { id: "b", name: "" },
    ]);
    expect(parseList("{not json", schema)).toEqual([]);
  });

  it("falls back to the default when the stored list cannot be read, but keeps a deliberate empty one", () => {
    const team = ALL_SLOTS.find((entry) => entry.id === "about.team.members")!;
    expect(slotList({ "about.team.members": "{broken" }, team).length).toBe(10);
    expect(slotList({ "about.team.members": "[]" }, team)).toEqual([]);
  });

  it("flags an item missing a required field", () => {
    expect(isCompleteItem({ id: "a", name: "" }, schema)).toBe(false);
    expect(isCompleteItem({ id: "a", name: "Ana" }, schema)).toBe(true);
  });
});

describe("mediaInUse", () => {
  it("counts the photos the page shows, defaults included", () => {
    const ids = mediaInUse({}).map((use) => use.id);
    expect(ids).toEqual(expect.arrayContaining([2198, 2210, 2199, 2200, 2209]));
  });

  it("follows what was chosen, list items and card photos too", () => {
    const uses = mediaInUse({
      "about.hero.image": "77",
      "about.team.members": JSON.stringify([{ id: "x", photo: "88", name: "Ana", role: "Host" }]),
      [placeImageSlotId("el-zonte")]: "99",
    });
    const ids = uses.map((use) => use.id);
    expect(ids).toEqual(expect.arrayContaining([77, 88, 99]));
    expect(ids).not.toContain(2198);
    expect(uses.find((use) => use.id === 88)?.where).toContain("Ana");
  });
});
