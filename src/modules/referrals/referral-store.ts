import "server-only";

import { db } from "@/infrastructure/prisma/db";
import { getBookingById } from "@/modules/bookings/server/bookings";

export async function findActiveReferral(input: string) {
  const code = input.trim().toUpperCase();

  if (!/^[A-Z0-9-]{4,24}$/.test(code)) {
    return null;
  }

  const referral = await db.orm.public.ReferralCode
    .where({ code, active: true })
    .first();

  if (!referral) {
    return null;
  }

  return {
    id: referral.id,
    code: referral.code,
  };
}

export async function recordReferralForBooking(
  bookingId: number,
  inputCode: string
) {
  if (!Number.isSafeInteger(bookingId) || bookingId <= 0) {
    return { ok: false, reason: "invalid_booking_id" };
  }

  const code = inputCode.trim().toUpperCase();

  // Check whether an attribution already exists.
  const existing = await db.orm.public.ReferralAttribution
    .where({ bookingId })
    .first();

  if (existing) {
    if (existing.referralCode === code) {
      return {
        ok: true,
        alreadyRecorded: true,
        bookingId,
        code,
      };
    }

    return { ok: false, reason: "already_attributed" };
  }

  // Verify the booking exists and is pending.
  const booking = await getBookingById(bookingId);

  if (!booking) {
    return { ok: false, reason: "booking_not_found" };
  }

  if (booking.status !== "pending_payment") {
    return { ok: false, reason: "booking_not_pending" };
  }

  // Validate the referral against PostgreSQL.
  const referral = await findActiveReferral(code);

  if (!referral) {
    return { ok: false, reason: "invalid_referral" };
  }

  try {
    const attribution = await db.orm.public.ReferralAttribution
      .create({
        bookingId,
        referralCode: referral.code,
        status: "pending",
      });

    return {
      ok: true,
      alreadyRecorded: false,
      bookingId: attribution.bookingId,
      code: attribution.referralCode,
    };
  } catch (error) {
    // Another request may have inserted the attribution first.
    const saved = await db.orm.public.ReferralAttribution
      .where({ bookingId })
      .first();

    // If nothing was saved, propagate the original error.
    if (!saved) {
      throw error;
    }

    if (saved.referralCode === referral.code) {
      return {
        ok: true,
        alreadyRecorded: true,
        bookingId,
        code: referral.code,
      };
    }

    return { ok: false, reason: "already_attributed" };
  }
}