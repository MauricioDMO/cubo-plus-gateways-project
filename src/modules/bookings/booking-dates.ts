/*
 * Dates as the booking flow handles them: ISO "YYYY-MM-DD" strings, midnight
 * UTC, no time zone anywhere.
 *
 * A stay is a pair of calendar days, not a pair of instants. Doing the
 * arithmetic in local time means a guest in one time zone and a server in
 * another disagree about which day "tomorrow" is, and the difference shows up
 * as an off-by-one night on the total.
 *
 * These lived inside BookingWidget until the phone booking bar needed the same
 * three functions; two copies of date arithmetic is two chances to be wrong.
 */

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(date: string, days: number) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export function nightsBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/**
 * The stay after a new check-in has been picked.
 *
 * Moving check-in past check-out, or to within fewer than the minimum nights
 * of it, has to move check-out too -- otherwise the form sits on a stay it
 * will refuse to submit and says nothing about why. An existing check-out that
 * is already far enough out is left exactly where the guest put it.
 */
export function stayFromCheckIn(nextCheckIn: string, currentCheckOut: string, minStay: number) {
  const nights = Math.max(1, minStay);
  const earliestCheckOut = addDaysIso(nextCheckIn || todayIso(), nights);
  return {
    checkIn: nextCheckIn,
    checkOut: !currentCheckOut || currentCheckOut < earliestCheckOut ? earliestCheckOut : currentCheckOut,
  };
}

/**
 * A "YYYY-MM-DD" column value as a Date on the local calendar.
 *
 * `new Date("2026-10-20")` is midnight **UTC**, which anywhere west of
 * Greenwich formats as the day before -- El Salvador is UTC-6, so a request
 * asking for a call on the 20th was listed in the admin as the 19th. Measured
 * against a real row, not guessed.
 *
 * Only for date-only values. A timestamptz (created_at) is a real instant and
 * must go through `new Date()` so it is shown in the reader's own time.
 */
export function isoDateToLocalDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  // Rejects 2026-02-31, which would silently roll over into March.
  return date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}
