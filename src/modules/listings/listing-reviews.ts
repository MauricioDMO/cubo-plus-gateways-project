/*
 * Guest reviews, per listing.
 *
 * The ones on the site are real: every one was written by a guest on Airbnb
 * about the stay it is attached to, copied from the Getaways El Salvador host
 * account on 8 September 2026, and left exactly as written -- spelling,
 * punctuation and language are the guest's own, which is why some cards are in
 * Spanish, one in French and one in German.
 *
 * Two rules follow from that, and both are enforced by what is NOT here:
 *
 *   1. A listing with no reviews gets NO section. Not a placeholder, not an
 *      average of the other properties. parseListingReviews returns an empty
 *      list and the page renders nothing.
 *   2. Nobody writes a review. The admin editor exists to copy a real one
 *      across from Airbnb, not to compose one -- see the note it carries.
 *
 * They used to be a constant in this file, editable only by a developer. They
 * are now in each listing's attributes bag, put there by
 * scripts/move-reviews-into-attributes.mjs, which is what makes them editable
 * in the admin. That script is also the record of where they came from.
 *
 * Reviews are still a snapshot rather than a feed -- Airbnb has no public API
 * for this -- so they go stale as guests write more, and somebody has to paste
 * the new ones in.
 */

export type ListingReview = {
  /** First name as Airbnb shows it. No surnames, no photographs. */
  guest: string;
  /** Where the guest is from. Absent when Airbnb shows tenure instead. */
  from?: string;
  /** Month and year of the stay, already formatted. */
  stayed: string;
  rating: number;
  /** The guest's own words, in the language they wrote them. */
  body: string;
  /** So the page can mark a card that is not in the page's language. */
  lang: "en" | "es" | "fr" | "de";
};

/** The average and count of what is actually shown, computed, never typed. */
export function reviewSummary(reviews: ListingReview[]) {
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    count: reviews.length,
    average: reviews.length ? Math.round((total / reviews.length) * 10) / 10 : 0,
  };
}

/* ------------------------------------------------------------------ storage */

/*
 * Where a listing's reviews live now: one `attributes` key holding a JSON
 * string, the same shape and for the same reason as `gallery_groups` -- see
 * modules/listings/listing-gallery-groups.ts. A table would need a migration, and
 * migrations here can only be run by the account owner; 0005 waited weeks.
 * This works the moment it is deployed, and the admin form already
 * round-trips the attributes bag.
 *
 * Parsing is total. A hand-edited attributes bag, or a half-written review,
 * must yield fewer cards rather than a 500 on a property page that is taking
 * bookings.
 */

export const REVIEWS_KEY = "reviews";

const LANGS = new Set(["en", "es", "fr", "de"]);

type Attributes = Record<string, unknown> | null | undefined;

export function parseListingReviews(attributes: Attributes): ListingReview[] {
  const raw = attributes?.[REVIEWS_KEY];
  if (raw == null) return [];

  let decoded: unknown = raw;
  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return [];
    try {
      decoded = JSON.parse(text);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(decoded)) return [];

  const out: ListingReview[] = [];
  for (const entry of decoded) {
    if (entry == null || typeof entry !== "object" || Array.isArray(entry)) continue;
    const row = entry as Record<string, unknown>;
    const guest = typeof row.guest === "string" ? row.guest.trim() : "";
    const body = typeof row.body === "string" ? row.body.trim() : "";
    // A card with no name or no words is not a review. Dropped rather than
    // rendered as an empty quote attributed to nobody.
    if (!guest || !body) continue;

    const rating = Number(row.rating);
    const from = typeof row.from === "string" ? row.from.trim() : "";
    const lang = typeof row.lang === "string" && LANGS.has(row.lang) ? (row.lang as ListingReview["lang"]) : "en";

    out.push({
      guest,
      ...(from ? { from } : {}),
      stayed: typeof row.stayed === "string" ? row.stayed.trim() : "",
      // Airbnb has no half stars and no zero, so anything else is a typo in
      // the admin, not a rating. Five is what every real one of these is.
      rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : 5,
      body,
      lang,
    });
  }
  return out;
}

/**
 * A review with a name or words but not both. The owner has to finish it or
 * clear it, so the message names the review and the gap.
 */
export class IncompleteReviewError extends Error {}

/*
 * The value to store. No reviews returns "" so the key drops out entirely.
 *
 * A row left completely blank is skipped. A half-written one is refused rather
 * than dropped: a dropped review vanishes on save with nobody told, which is
 * how a card used to disappear from the property page.
 */
export function serializeListingReviews(reviews: ListingReview[]): string {
  const kept: ListingReview[] = [];
  reviews.forEach((review, index) => {
    const guest = review.guest.trim();
    const body = review.body.trim();
    const from = review.from?.trim() ?? "";
    const stayed = review.stayed.trim();
    if (!guest && !body && !from && !stayed) return;
    if (!guest || !body) {
      const missing = [!guest && "the guest's first name", !body && "the text the guest wrote"]
        .filter(Boolean)
        .join(" and ");
      throw new IncompleteReviewError(`Review ${index + 1} needs ${missing}.`);
    }
    kept.push({
      guest,
      ...(from ? { from } : {}),
      stayed,
      rating: review.rating,
      body,
      lang: review.lang,
    });
  });
  if (kept.length === 0) return "";
  return JSON.stringify(kept);
}
