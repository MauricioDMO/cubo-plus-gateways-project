import "server-only";

import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

/*
 * The bookings table, kept in memory and written to `.data/bookings.json`.
 *
 * Why a file and not a database: this copy of the site runs on one laptop, for
 * a class. Dev reloads and restarts keep the bookings because the file survives
 * them. Nothing here ships to the repo: `.data/` is gitignored, and no guest
 * data is in the code.
 *
 * Everything is synchronous on purpose. Node runs one JS thread, so a read and
 * a write cannot interleave in the middle of a status change, and the file is
 * never read half-written.
 *
 * The only way a booking becomes "confirmed" is markPaid(paymentId) below.
 * Pages and routes never set the status themselves.
 */

export type BookingStatus = "pending_payment" | "confirmed" | "cancelled";

export type Booking = {
  id: number;
  listing_id: number;
  check_in: string;
  check_out: string;
  nights: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  guest_notes: string | null;
  /** Party size the guest picked at checkout. Null until they pick one. */
  guests: number | null;
  currency: "USD";
  price_per_night_cents: number;
  cleaning_fee_cents: number;
  /** The quote the guest agreed to. Written by /api/checkout/quote. */
  pet_fee_cents: number;
  extra_guest_fee_cents: number;
  discount_cents: number;
  /** IVA plus tourism tax, the two taxes on the bill added together. */
  tax_cents: number;
  total_amount_cents: number;
  coupon_code: string | null;
  status: BookingStatus;
  /** The handle the guest's checkout URL carries (`?session_id=`). */
  checkout_session_id: string | null;
  /** The payment id from the payment provider. Set once a payment is opened. */
  payment_reference: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type NewBooking = Omit<Booking, "id" | "created_at" | "updated_at">;

type StoreState = { nextId: number; bookings: Booking[] };

const DATA_FILE = path.join(process.cwd(), ".data", "bookings.json");

/* Kept on globalThis so a hot reload of this module does not forget the
   bookings made a minute ago. The file is the copy that survives a restart. */
const globalForStore = globalThis as typeof globalThis & { __getawaysBookingStore?: StoreState };

function readFromDisk(): StoreState | null {
  try {
    const parsed = JSON.parse(readFileSync(DATA_FILE, "utf8")) as Partial<StoreState>;
    if (!Array.isArray(parsed.bookings)) return null;
    const highest = parsed.bookings.reduce((max, booking) => Math.max(max, booking.id), 0);
    return {
      bookings: parsed.bookings,
      nextId: typeof parsed.nextId === "number" && parsed.nextId > highest ? parsed.nextId : highest + 1,
    };
  } catch (error) {
    // No file yet is the normal first run. Anything else is logged and the store starts empty.
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("Could not read .data/bookings.json, starting with no bookings:", error);
    }
    return null;
  }
}

function state(): StoreState {
  if (!globalForStore.__getawaysBookingStore) {
    globalForStore.__getawaysBookingStore = readFromDisk() ?? { nextId: 1, bookings: [] };
  }
  return globalForStore.__getawaysBookingStore;
}

function persist(): void {
  mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(state(), null, 2));
  renameSync(tmp, DATA_FILE);
}

/* Copies out, so a caller that edits its copy cannot change the store behind
   the back of the next write. */
function copy(booking: Booking): Booking {
  return { ...booking };
}

export async function listBookings(): Promise<Booking[]> {
  return state().bookings.map(copy);
}

export async function getBookingById(id: number): Promise<Booking | null> {
  const found = state().bookings.find((booking) => booking.id === id);
  return found ? copy(found) : null;
}

export async function getBookingBySessionId(sessionId: string): Promise<Booking | null> {
  const found = state().bookings.find((booking) => booking.checkout_session_id === sessionId);
  return found ? copy(found) : null;
}

export async function createBooking(fields: NewBooking): Promise<Booking> {
  const store = state();
  const now = new Date().toISOString();
  const booking: Booking = { ...fields, id: store.nextId, created_at: now, updated_at: now };
  store.nextId += 1;
  store.bookings.push(booking);
  persist();
  return copy(booking);
}

/**
 * Changes fields on one booking. The status is not guarded here, so callers
 * (modules/bookings/server/bookings.ts) must check it before they write. Returns null if no such booking.
 */
export async function updateBooking(
  id: number,
  patch: Partial<Omit<Booking, "id" | "created_at">>
): Promise<Booking | null> {
  const booking = state().bookings.find((entry) => entry.id === id);
  if (!booking) return null;
  Object.assign(booking, patch, { updated_at: new Date().toISOString() });
  persist();
  return copy(booking);
}

/** Stays already paid for on a listing, as half-open date ranges. Used for the availability calendar. */
export async function confirmedRangesForListing(listingId: number): Promise<Array<{ start_date: string; end_date: string }>> {
  return state()
    .bookings.filter((booking) => booking.listing_id === listingId && booking.status === "confirmed")
    .map((booking) => ({ start_date: booking.check_in, end_date: booking.check_out }));
}

export type MarkPaidResult =
  | { found: false }
  | { found: true; booking: Booking; alreadyConfirmed: boolean; doubleBooked: boolean };

/**
 * The ONLY place a booking becomes confirmed.
 *
 * Called by the payment provider (modules/payments/btc-mock.ts, once students
 * implement it) or by the dev-only "simulate payment" button in
 * app/api/checkout/btc/route.ts. Looks the booking up by its payment id.
 *
 * - Already confirmed: a no-op, so a repeated call is safe.
 * - Cancelled: the money is recorded on the row and the status stays cancelled,
 *   so someone can refund it by hand.
 * - Dates taken by a confirmed booking since the payment opened: cancelled, same as above.
 */
export async function markPaid(paymentId: string): Promise<MarkPaidResult> {
  const store = state();
  const booking = store.bookings.find((entry) => entry.payment_reference === paymentId);
  if (!booking) return { found: false };

  if (booking.status === "confirmed") {
    return { found: true, booking: copy(booking), alreadyConfirmed: true, doubleBooked: false };
  }

  const stamp = new Date().toISOString();
  const overlaps = store.bookings.some(
    (other) =>
      other.id !== booking.id &&
      other.listing_id === booking.listing_id &&
      other.status === "confirmed" &&
      other.check_in < booking.check_out &&
      booking.check_in < other.check_out
  );

  if (booking.status === "cancelled" || overlaps) {
    const note = overlaps
      ? "Auto-cancelled: these dates were confirmed by another booking while this payment was open."
      : "Payment received after this booking was cancelled.";
    booking.status = "cancelled";
    booking.admin_notes = [booking.admin_notes, note, "Refund the payment to the guest by hand."]
      .filter(Boolean)
      .join("\n");
    booking.updated_at = stamp;
    persist();
    return { found: true, booking: copy(booking), alreadyConfirmed: false, doubleBooked: overlaps };
  }

  booking.status = "confirmed";
  booking.updated_at = stamp;
  persist();
  return { found: true, booking: copy(booking), alreadyConfirmed: false, doubleBooked: false };
}
