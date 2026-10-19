import "server-only";

import listingRows from "@/data/listings.json";
import type { ListingRow as StoredListingRow } from "@/data/types";
import { DatesUnavailableError, NotFoundError, ValidationError } from "@/modules/bookings/booking-errors";
import {
  createBooking,
  confirmedRangesForListing,
  getBookingById,
  getBookingBySessionId,
  updateBooking,
  type Booking,
  type NewBooking,
} from "@/modules/bookings/server/booking-store";
import { priceFieldsFromAttributes } from "@/modules/bookings/booking-quote";
import { isListingActive } from "@/modules/listings/listing-visibility";

/*
 * The booking rules: what counts as a valid stay, what dates are taken, and
 * how a new booking is written down. The storage itself is in
 * modules/bookings/server/booking-store.ts.
 *
 * Listings are read from data/listings.json (public data the site already
 * shows). Nothing here talks to a database or a payment provider.
 */

export { getBookingById, getBookingBySessionId } from "@/modules/bookings/server/booking-store";
export type { Booking, BookingStatus } from "@/modules/bookings/server/booking-store";
export { DatesUnavailableError, NotFoundError, ValidationError } from "@/modules/bookings/booking-errors";

export type BlockedRange = { start_date: string; end_date: string };

export type BookingInput = {
  listing_id: number;
  check_in: string;
  check_out: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  guest_notes?: string;
};

export type ListingRow = Pick<StoredListingRow, "id" | "slug" | "title" | "attributes">;

const LISTINGS: ListingRow[] = listingRows;

/** The listing with this id, or null. Public data only. */
export function getListing(id: number): ListingRow | null {
  return LISTINGS.find((listing) => listing.id === id) ?? null;
}

/** Read-only receipt data, including missing sessions; the template owns the status messages. */
export async function getBookingConfirmationData(sessionId: string | undefined) {
  const booking = sessionId ? await getBookingBySessionId(sessionId) : null;
  const listing = booking ? getListing(booking.listing_id) : null;
  return { sessionId, booking, listing };
}

export type BookingConfirmationData = Awaited<ReturnType<typeof getBookingConfirmationData>>;

// Owner and guest both read these, so each names the thing to fix in plain words.
const MISSING_FIELD_MESSAGES: Record<string, string> = {
  guest_name: "Add the guest's name.",
  guest_email: "Add the guest's email.",
  check_in: "Pick a check-in date.",
  check_out: "Pick a check-out date.",
};

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(MISSING_FIELD_MESSAGES[field] ?? "Fill in every required field.");
  }
  return value;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function nightsBetween(checkIn: string, checkOut: string): number {
  const inDate = new Date(`${checkIn}T00:00:00Z`);
  const outDate = new Date(`${checkOut}T00:00:00Z`);
  return Math.round((outDate.getTime() - inDate.getTime()) / 86_400_000);
}

/**
 * Throws NotFoundError unless the listing exists AND is on the site. Used by
 * the public availability route. One message for both cases, so the response
 * cannot be used to tell a hidden listing from a missing one.
 */
export async function requireBookableListing(listingId: number): Promise<void> {
  const listing = getListing(listingId);
  if (!listing || !isListingActive(listing.attributes)) {
    throw new NotFoundError("This property was not found. It may have been removed from the site.");
  }
}

/**
 * Dates that are taken for a listing: stays already paid for. Blocks set by
 * hand are not part of this build (there is no admin), so none are added.
 */
export async function getBlockedRanges(listingId: number): Promise<BlockedRange[]> {
  return confirmedRangesForListing(listingId);
}

/** The same as getBlockedRanges for many listings at once, for the properties archive. */
export async function getBlockedRangesForListings(listingIds: number[]): Promise<Map<number, BlockedRange[]>> {
  const byListing = new Map<number, BlockedRange[]>();
  for (const listingId of listingIds) {
    byListing.set(listingId, await getBlockedRanges(listingId));
  }
  return byListing;
}

/** Half-open [start, end) overlap: checking out and in on the same day is fine. */
export function rangesOverlapPublic(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Writes a new pending booking from the dates and guest details. The price here
 * is nights x nightly rate plus the cleaning fee. The checkout quote adds the
 * extra guests, pet, coupon and taxes later (see app/api/checkout/quote).
 */
export async function createPendingBooking(input: BookingInput): Promise<Booking> {
  const guestName = requireNonEmptyString(input.guest_name, "guest_name");
  const guestEmail = requireNonEmptyString(input.guest_email, "guest_email");
  const checkIn = requireNonEmptyString(input.check_in, "check_in");
  const checkOut = requireNonEmptyString(input.check_out, "check_out");
  if (!ISO_DAY.test(checkIn) || !ISO_DAY.test(checkOut)) {
    throw new ValidationError("Pick the dates from the calendar.");
  }
  if (checkIn >= checkOut) {
    throw new ValidationError("Check-out must be after check-in.");
  }
  const today = new Date().toISOString().slice(0, 10);
  if (checkIn < today) {
    throw new ValidationError("Check-in cannot be in the past.");
  }

  const listing = getListing(input.listing_id);
  if (!listing || !isListingActive(listing.attributes)) {
    throw new NotFoundError("This property was not found. It may have been removed from the site.");
  }

  const fields = priceFieldsFromAttributes(listing.attributes);
  if (fields.pricePerNightCents <= 0) throw new ValidationError("This property has no price yet.");

  const nights = nightsBetween(checkIn, checkOut);
  const attrs = listing.attributes ?? {};
  if (attrs.booking_min_length && attrs.booking_min_length.trim() !== "") {
    const minNights = Number(attrs.booking_min_length);
    if (Number.isFinite(minNights) && nights < minNights) {
      throw new ValidationError(`This property needs a stay of at least ${minNights} ${minNights === 1 ? "night" : "nights"}.`);
    }
  }

  const blocked = await getBlockedRanges(input.listing_id);
  if (blocked.some((range) => rangesOverlapPublic(checkIn, checkOut, range.start_date, range.end_date))) {
    throw new DatesUnavailableError("Those dates are no longer available for this listing.");
  }

  const pricePerNightCents = fields.pricePerNightCents;
  const cleaningFeeCents = fields.cleaningFeeCents;

  const fresh: NewBooking = {
    listing_id: input.listing_id,
    check_in: checkIn,
    check_out: checkOut,
    nights,
    guest_name: guestName,
    guest_email: guestEmail,
    guest_phone: input.guest_phone?.trim() || null,
    guest_notes: input.guest_notes?.trim() || null,
    guests: null,
    currency: "USD",
    price_per_night_cents: pricePerNightCents,
    cleaning_fee_cents: cleaningFeeCents,
    pet_fee_cents: 0,
    extra_guest_fee_cents: 0,
    discount_cents: 0,
    tax_cents: 0,
    total_amount_cents: nights * pricePerNightCents + cleaningFeeCents,
    coupon_code: null,
    status: "pending_payment",
    checkout_session_id: null,
    payment_reference: null,
    admin_notes: null,
  };
  return createBooking(fresh);
}

export async function attachCheckoutSession(bookingId: number, sessionId: string): Promise<void> {
  const updated = await updateBooking(bookingId, { checkout_session_id: sessionId });
  if (!updated) throw new NotFoundError("This booking was not found. It may have been deleted.");
}

/**
 * Saves a priced quote onto the booking. Refused (returns null) once the stay is
 * no longer waiting for payment, or once a payment is open: the figure on screen
 * must stay the figure the payment charges.
 */
export async function saveQuote(
  bookingId: number,
  patch: Partial<Omit<Booking, "id" | "created_at">>
): Promise<Booking | null> {
  const current = await getBookingById(bookingId);
  if (!current || current.status !== "pending_payment" || current.payment_reference) return null;
  return updateBooking(bookingId, patch);
}
