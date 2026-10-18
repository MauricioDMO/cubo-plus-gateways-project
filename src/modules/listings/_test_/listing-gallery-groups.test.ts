import { describe, expect, it } from "vitest";

import {
  buildGalleryTour,
  GALLERY_GROUPS_KEY,
  parseGalleryGroups,
  ROOM_LABELS,
  serializeGalleryGroups,
  pickPhotoIdByRoom,
} from "@/modules/listings/listing-gallery-groups";

describe("parseGalleryGroups", () => {
  it("reads the JSON string the admin writes", () => {
    expect(parseGalleryGroups({ [GALLERY_GROUPS_KEY]: '{"12":"Bedrooms","13":"Bathrooms"}' })).toEqual({
      12: "Bedrooms",
      13: "Bathrooms",
    });
  });

  it("returns nothing rather than throwing on anything unusable", () => {
    // A property page that is taking bookings must not 500 because somebody
    // hand-edited the attributes JSON.
    for (const raw of ["", "   ", "not json", "[1,2,3]", '"a string"', "null", "42"]) {
      expect(parseGalleryGroups({ [GALLERY_GROUPS_KEY]: raw }), raw).toEqual({});
    }
    expect(parseGalleryGroups({})).toEqual({});
    expect(parseGalleryGroups(null)).toEqual({});
  });

  it("drops entries that are not an id and a label", () => {
    expect(
      parseGalleryGroups({ [GALLERY_GROUPS_KEY]: '{"12":"Bedrooms","abc":"Kitchen","13":"","14":null,"15":7}' })
    ).toEqual({ 12: "Bedrooms" });
  });

  it("also accepts an already-decoded object", () => {
    // attributes is jsonb, so a value written by anything other than the admin
    // form can arrive as a real object rather than a string.
    expect(parseGalleryGroups({ [GALLERY_GROUPS_KEY]: { 12: "Pool" } as unknown })).toEqual({ 12: "Pool" });
  });
});

describe("serializeGalleryGroups", () => {
  it("round-trips", () => {
    const groups = { 12: "Bedrooms", 13: "Pool" };
    expect(parseGalleryGroups({ [GALLERY_GROUPS_KEY]: serializeGalleryGroups(groups) })).toEqual(groups);
  });

  it("returns an empty string when there is nothing to store, so the key drops out", () => {
    expect(serializeGalleryGroups({})).toBe("");
    expect(serializeGalleryGroups({ 12: "   " })).toBe("");
  });
});

describe("buildGalleryTour", () => {
  const media = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

  it("orders groups the way ROOM_LABELS does, not the tagging order", () => {
    // Every property's tour then reads the same way, so a guest comparing two
    // is not re-learning the layout each time.
    const tour = buildGalleryTour(media, { 1: "Bathrooms", 2: "Kitchen", 3: "Bedrooms", 4: "Pool" });
    expect(tour.map((group) => group.label)).toEqual(["Kitchen", "Bedrooms", "Bathrooms", "Pool"]);
    expect(ROOM_LABELS.indexOf("Kitchen")).toBeLessThan(ROOM_LABELS.indexOf("Bedrooms"));
  });

  it("keeps untagged photos in one leading group", () => {
    const tour = buildGalleryTour(media, { 2: "Bedrooms" });
    expect(tour.map((group) => group.label)).toEqual(["All photos", "Bedrooms"]);
    expect(tour[0].media.map((m) => m.id)).toEqual([1, 3, 4]);
  });

  it("shows every photo, tagged or not", () => {
    const tour = buildGalleryTour(media, { 1: "Pool", 2: "Something nobody offers" });
    expect(tour.flatMap((group) => group.media)).toHaveLength(media.length);
  });

  it("still shows a label that is not in ROOM_LABELS", () => {
    const tour = buildGalleryTour([{ id: 1 }], { 1: "Rooftop" });
    expect(tour).toEqual([{ label: "Rooftop", media: [{ id: 1 }] }]);
  });

  it("returns nothing for no media, so the opener can hide itself", () => {
    expect(buildGalleryTour([], {})).toEqual([]);
  });
});

describe("pickPhotoIdByRoom", () => {
  const listings = [
    { attributes: { [GALLERY_GROUPS_KEY]: JSON.stringify({ 11: "Pool", 12: "Views" }) } },
    { attributes: { [GALLERY_GROUPS_KEY]: JSON.stringify({ 21: "Views", 22: "Terrace" }) } },
  ];

  it("tries the rooms in the order it is given them", () => {
    expect(pickPhotoIdByRoom(listings, ["Views", "Pool"])).toBe(12);
    expect(pickPhotoIdByRoom(listings, ["Pool", "Views"])).toBe(11);
  });

  it("skips photographs already used on the page", () => {
    // The homepage showed the same palms twice, a few hundred pixels apart,
    // because the place card and the concierge band both asked for the first
    // thing tagged Views.
    expect(pickPhotoIdByRoom(listings, ["Views"], new Set([12]))).toBe(21);
    expect(pickPhotoIdByRoom(listings, ["Views"], new Set([12, 21]))).toBeNull();
  });

  it("looks past the first listing when the first has nothing tagged", () => {
    expect(pickPhotoIdByRoom(listings, ["Terrace"])).toBe(22);
  });

  it("returns null rather than an untagged photo", () => {
    expect(pickPhotoIdByRoom(listings, ["Kitchen"])).toBeNull();
    expect(pickPhotoIdByRoom([], ["Views"])).toBeNull();
  });
});
