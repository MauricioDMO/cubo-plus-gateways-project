import { describe, expect, it } from "vitest";

import {
  IncompleteReviewError,
  parseListingReviews,
  reviewSummary,
  REVIEWS_KEY,
  serializeListingReviews,
  type ListingReview,
} from "@/modules/listings/listing-reviews";

const review = (over: Partial<ListingReview> = {}): ListingReview => ({
  guest: "Claudia",
  stayed: "August 2026",
  rating: 5,
  body: "Un lugar muy lindo y familiar!",
  lang: "es",
  ...over,
});

describe("the round-trip", () => {
  it("gives back exactly what was stored", () => {
    // The invariant that matters: saving a property replaces its whole
    // attributes column, so anything parse cannot read back is a review
    // deleted from the site by the next press of Save.
    const reviews = [
      review(),
      review({ guest: "Arturo", from: "Guadalajara, Mexico", stayed: "July 2026", lang: "en", body: "Great stay." }),
    ];
    expect(parseListingReviews({ [REVIEWS_KEY]: serializeListingReviews(reviews) })).toEqual(reviews);
  });

  it("drops the key entirely when there are no reviews", () => {
    // "" is how buildAttributes is told to remove a key, and an absent key is
    // the state every property started in.
    expect(serializeListingReviews([])).toBe("");
    expect(parseListingReviews({})).toEqual([]);
    expect(parseListingReviews({ [REVIEWS_KEY]: "" })).toEqual([]);
    expect(parseListingReviews(null)).toEqual([]);
  });

  it("keeps an absent 'from' absent rather than storing an empty one", () => {
    const stored = serializeListingReviews([review({ from: "   " })]);
    expect(stored).not.toContain("from");
    expect(parseListingReviews({ [REVIEWS_KEY]: stored })[0].from).toBeUndefined();
  });
});

describe("parseListingReviews", () => {
  it("never throws on a hand-edited attributes bag", () => {
    // A property page taking bookings must not 500 because somebody typed in
    // the raw-JSON box.
    expect(parseListingReviews({ [REVIEWS_KEY]: "{not json" })).toEqual([]);
    expect(parseListingReviews({ [REVIEWS_KEY]: '{"a":1}' })).toEqual([]);
    expect(parseListingReviews({ [REVIEWS_KEY]: "[1, null, \"x\"]" })).toEqual([]);
  });

  it("drops a card with no name or no words", () => {
    const stored = JSON.stringify([
      { guest: "", body: "Lovely", rating: 5, stayed: "", lang: "en" },
      { guest: "Ana", body: "   ", rating: 5, stayed: "", lang: "en" },
      { guest: "Ana", body: "Lovely", rating: 5, stayed: "", lang: "en" },
    ]);
    expect(parseListingReviews({ [REVIEWS_KEY]: stored }).map((r) => r.guest)).toEqual(["Ana"]);
  });

  it("repairs a rating that is not one of the five", () => {
    const stored = JSON.stringify([
      { guest: "A", body: "x", rating: 4.5, lang: "en", stayed: "" },
      { guest: "B", body: "x", rating: 0, lang: "en", stayed: "" },
      { guest: "C", body: "x", rating: 9, lang: "en", stayed: "" },
      { guest: "D", body: "x", rating: 4, lang: "en", stayed: "" },
    ]);
    expect(parseListingReviews({ [REVIEWS_KEY]: stored }).map((r) => r.rating)).toEqual([5, 5, 5, 4]);
  });

  it("falls back to English for a language the page cannot mark", () => {
    const stored = JSON.stringify([{ guest: "A", body: "x", rating: 5, lang: "klingon", stayed: "" }]);
    expect(parseListingReviews({ [REVIEWS_KEY]: stored })[0].lang).toBe("en");
  });

  it("reads an object that was stored unstringified", () => {
    // jsonb holds either; the admin writes a string, but a row edited in the
    // Supabase SQL editor would not be.
    expect(parseListingReviews({ [REVIEWS_KEY]: [review()] as unknown })).toHaveLength(1);
  });
});

describe("reviewSummary", () => {
  it("computes the average shown on the page", () => {
    expect(reviewSummary([review({ rating: 5 }), review({ rating: 4 })])).toEqual({ count: 2, average: 4.5 });
    expect(reviewSummary([])).toEqual({ count: 0, average: 0 });
  });
});

describe("serializeListingReviews", () => {
  it("skips a row that was left completely blank", () => {
    // An "Add a review" somebody changed their mind about must not be saved.
    const stored = serializeListingReviews([review(), review({ guest: "", stayed: "", body: "" })]);
    expect(JSON.parse(stored)).toHaveLength(1);
  });

  it("refuses a review with words but no name, and names the review", () => {
    const reviews = [review(), review({ guest: "  " })];
    expect(() => serializeListingReviews(reviews)).toThrow(IncompleteReviewError);
    expect(() => serializeListingReviews(reviews)).toThrow("Review 2 needs the guest's first name.");
  });

  it("refuses a review with a name but no words", () => {
    expect(() => serializeListingReviews([review({ body: "   " })])).toThrow(
      "Review 1 needs the text the guest wrote."
    );
  });

  it("names both gaps when a review has a stay date but neither a name nor words", () => {
    expect(() => serializeListingReviews([review({ guest: "", body: "" })])).toThrow(
      "Review 1 needs the guest's first name and the text the guest wrote."
    );
  });
});
