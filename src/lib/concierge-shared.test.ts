import { describe, expect, it } from "vitest";

import {
  buildConciergeHref,
  conciergeMailto,
  conciergeServiceLabel,
  CONCIERGE_SERVICE_GROUPS,
  CONCIERGE_SERVICES,
  CONCIERGE_SERVICE_LABELS,
  parseConciergePrefill,
} from "./concierge-shared";

describe("parseConciergePrefill", () => {
  it("reads what a property page sends", () => {
    expect(
      parseConciergePrefill({ listing: "good-waves", check_in: "2026-09-15", check_out: "2026-09-20" })
    ).toEqual({
      listingSlug: "good-waves",
      checkIn: "2026-09-15",
      checkOut: "2026-09-20",
      services: [],
    });
  });

  it("drops a slug that is not a slug", () => {
    /*
     * These values reach a form field and the body of a mailto: link, and
     * they arrive in a URL anybody can write. Dropping beats echoing.
     */
    for (const listing of ["../../etc/passwd", "<script>", "Good Waves", "a".repeat(201), ""]) {
      expect(parseConciergePrefill({ listing }).listingSlug, listing).toBeUndefined();
    }
  });

  it("drops a date that is not a date", () => {
    for (const check_in of ["tomorrow", "15/09/2026", "2026-9-15", ""]) {
      expect(parseConciergePrefill({ check_in }).checkIn, check_in).toBeUndefined();
    }
  });

  it("takes the first value when a parameter is repeated", () => {
    // ?listing=a&listing=b arrives as an array; picking one beats crashing.
    expect(parseConciergePrefill({ listing: ["good-waves", "salty-soul"] }).listingSlug).toBe("good-waves");
  });

  it("returns nothing at all for an empty query string", () => {
    expect(parseConciergePrefill({})).toEqual({
      listingSlug: undefined,
      checkIn: undefined,
      checkOut: undefined,
      services: [],
    });
  });

  it("allowlists and deduplicates service preselection", () => {
    expect(
      parseConciergePrefill({
        services: ["surf_lessons", "helicopter,surf_lessons,private_chef"],
      }).services
    ).toEqual(["surf_lessons", "private_chef"]);
  });

  it("drops invalid service preselection without echoing it", () => {
    expect(parseConciergePrefill({ services: ["../../etc/passwd", "<script>", ""] }).services).toEqual([]);
  });
});

describe("the service vocabulary", () => {
  it("labels every service the form can offer", () => {
    // The checkboxes render from CONCIERGE_SERVICES and the server validates
    // against the same list; a service with no label would render blank.
    for (const service of CONCIERGE_SERVICES) {
      expect(CONCIERGE_SERVICE_LABELS[service], service).toBeTruthy();
    }
    expect(Object.keys(CONCIERGE_SERVICE_LABELS)).toHaveLength(CONCIERGE_SERVICES.length);
  });

  it("organizes every concrete service under Travel, Food & Drinks, Adventure or Sports", () => {
    expect(CONCIERGE_SERVICE_GROUPS.map((group) => group.label)).toEqual([
      "Travel",
      "Food & Drinks",
      "Adventure",
      "Sports",
    ]);
    expect(CONCIERGE_SERVICE_GROUPS.flatMap((group) => group.services)).toEqual([
      "airport_transfer",
      "rental_car",
      "private_driver",
      "private_chef",
      "restaurant_reservations",
      "grocery_runs",
      "tours",
      "boat_trips",
      "waterfalls",
      "turtle_release",
      "surf_lessons",
      "hiking",
      "atv_motorbike",
      "horseback_riding",
    ]);
  });

  it("gives every group an id that is usable as one", () => {
    // "Food & Drinks".toLowerCase() was being written straight into an
    // aria-labelledby and an element id. A space is not allowed in an id, so
    // the heading and the fieldset it labelled were not actually connected.
    for (const group of CONCIERGE_SERVICE_GROUPS) {
      expect(group.id, group.label).toMatch(/^[a-z][a-z0-9-]*$/);
    }
    expect(new Set(CONCIERGE_SERVICE_GROUPS.map((g) => g.id)).size).toBe(CONCIERGE_SERVICE_GROUPS.length);
  });

  it("can still name a service it no longer offers", () => {
    // A stored request keeps what was ticked the day it was sent; the admin
    // has to be able to read it after the form has moved on.
    expect(conciergeServiceLabel("vacation_planning")).toBe("Custom vacation planning");
    expect(conciergeServiceLabel("surf_lessons")).toBe("Surf lessons");
    // Never blank, even for something never offered.
    expect(conciergeServiceLabel("helicopter")).toBe("helicopter");
  });

  it("keeps the one deliberate planning path in the allowlist", () => {
    /* The id is the contract and the label is copy: a stored request keeps
       meaning what it meant when the words on screen change. */
    expect(CONCIERGE_SERVICE_LABELS.plan_everything).toBe(
      "Customize a full experience — we plan everything"
    );
  });

  it("refuses a service it no longer offers, while still being able to name it", () => {
    // Two different jobs. The allowlist decides what a request may contain;
    // the label map decides what a stored request reads as. Retiring
    // something has to do the first without breaking the second.
    for (const retired of ["something_else", "vacation_planning"]) {
      expect(CONCIERGE_SERVICES).not.toContain(retired);
      expect(conciergeServiceLabel(retired)).not.toBe(retired);
    }
  });
});

describe("buildConciergeHref", () => {
  it("creates an allowlisted preselection link and preserves listing context", () => {
    expect(buildConciergeHref({ service: "surf_lessons", listingSlug: "good-waves" })).toBe(
      "/concierge?services=surf_lessons&listing=good-waves#request"
    );
  });

  it("drops unsafe service and listing values", () => {
    expect(buildConciergeHref({ service: "helicopter", listingSlug: "../../etc/passwd" })).toBe(
      "/concierge#request"
    );
  });

  it("carries the stay dates, which the form reads back", () => {
    const href = buildConciergeHref({
      service: "airport_transfer",
      listingSlug: "good-waves",
      checkIn: "2026-12-20",
      checkOut: "2026-12-27",
    });
    expect(href).toBe(
      "/concierge?services=airport_transfer&listing=good-waves&check_in=2026-12-20&check_out=2026-12-27#request"
    );
    // The round trip is the point: what this writes, parseConciergePrefill reads.
    const prefill = parseConciergePrefill({
      services: "airport_transfer",
      listing: "good-waves",
      check_in: "2026-12-20",
      check_out: "2026-12-27",
    });
    expect(prefill.checkIn).toBe("2026-12-20");
    expect(prefill.checkOut).toBe("2026-12-27");
  });

  it("drops a malformed date rather than passing it on", () => {
    expect(buildConciergeHref({ checkIn: "20 December", checkOut: "2026-13" })).toBe(
      "/concierge#request"
    );
  });
});

describe("conciergeMailto", () => {
  const base = { name: "Ana Ruiz", email: "ana@example.com", services: [] as never[] };

  it("carries every field that was filled in", () => {
    const href = conciergeMailto("getaways@goodlifeelsalvador.com", {
      ...base,
      phone: "+50370000000",
      listingTitle: "Good Waves",
      services: ["airport_transfer", "private_chef", "plan_everything"],
      checkIn: "2026-09-15",
      checkOut: "2026-09-20",
      guests: "4",
      callDay: "2026-09-01",
      callWindow: "morning",
      message: "Landing at 11pm.",
    });
    const body = decodeURIComponent(new URL(href).searchParams.get("body") ?? "");
    for (const line of [
      "Name: Ana Ruiz",
      "Email: ana@example.com",
      "Phone: +50370000000",
      "Property: Good Waves",
      "Looking for: Airport transfer, Private chef, Customize a full experience — we plan everything",
      "Check-in: 2026-09-15",
      "Check-out: 2026-09-20",
      "Guests: 4",
      "Call: 2026-09-01 (morning)",
      "Landing at 11pm.",
    ]) {
      expect(body, line).toContain(line);
    }
  });

  it("addresses the email where it was told to", () => {
    const href = conciergeMailto("getaways@goodlifeelsalvador.com", base);
    expect(href.startsWith("mailto:getaways@goodlifeelsalvador.com?")).toBe(true);
  });

  it("leaves out what was left blank rather than writing empty lines", () => {
    const body = decodeURIComponent(
      new URL(conciergeMailto("x@y.zz", base)).searchParams.get("body") ?? ""
    );
    expect(body).toBe("Name: Ana Ruiz\nEmail: ana@example.com");
  });

  it("names the property in the subject when there is one", () => {
    const withProperty = new URL(conciergeMailto("x@y.zz", { ...base, listingTitle: "Good Waves" }));
    expect(withProperty.searchParams.get("subject")).toBe("Planning a stay at Good Waves");
    expect(new URL(conciergeMailto("x@y.zz", base)).searchParams.get("subject")).toBe("Planning a stay");
  });

  it("falls back to the slug when the title could not be loaded", () => {
    const body = decodeURIComponent(
      new URL(conciergeMailto("x@y.zz", { ...base, listingSlug: "good-waves" })).searchParams.get("body") ?? ""
    );
    expect(body).toContain("Property: good-waves");
  });

  it("escapes a message that would otherwise break the URL", () => {
    // Ampersands and newlines in a mailto body truncate it if they are not
    // encoded -- which would silently drop the rest of the request.
    const href = conciergeMailto("x@y.zz", { ...base, message: "Surf & yoga\nplus a car?" });
    const body = decodeURIComponent(new URL(href).searchParams.get("body") ?? "");
    expect(body).toContain("Surf & yoga\nplus a car?");
  });
});
