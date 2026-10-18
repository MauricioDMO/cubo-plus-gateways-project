import "server-only";

import couponRows from "@/data/coupons.json";
import { ValidationError } from "@/modules/bookings/booking-errors";
import {
  PUBLIC_COUPON_ERROR,
  businessTodayIso,
  evaluatePublicCoupon,
  type PublicCouponView,
} from "@/modules/coupons/coupon-rules";
import type { CouponQuote } from "@/modules/coupons/pricing";

/*
 * Coupons come from data/coupons.json, read-only. The class build ships one
 * sample code (GETAWAYS10, 10% off). Students can add rows to that file.
 *
 * Coupons are only checked here, never spent: nothing counts a use. A real
 * shop would count one when a payment is confirmed (see markPaid in
 * modules/bookings/server/booking-store.ts).
 */

export type Coupon = CouponQuote & {
  code: string;
  listing_id: number | null;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  active: boolean;
  note: string | null;
};

const COUPONS = couponRows as unknown as Coupon[];

function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

function asPublicCoupon(coupon: Coupon): PublicCouponView {
  return {
    active: coupon.active,
    listing_id: coupon.listing_id,
    expires_at: coupon.expires_at,
    max_uses: coupon.max_uses,
    use_count: coupon.use_count,
  };
}

/**
 * Validates a code for quoting a stay. Every failure gives the same public
 * message, so a guess cannot tell an unknown code from a spent one.
 */
export async function quoteCoupon(code: string, listingId: number): Promise<Coupon & { code: string }> {
  const normalized = normalizeCode(code);
  if (!normalized) throw new ValidationError("Enter a coupon code.");
  const coupon = COUPONS.find((entry) => normalizeCode(entry.code) === normalized) ?? null;
  // Business date, not UTC: a code is still good until the end of its last day in El Salvador.
  const verdict = evaluatePublicCoupon(coupon ? asPublicCoupon(coupon) : null, listingId, businessTodayIso());
  if (!verdict.ok || !coupon) throw new ValidationError(PUBLIC_COUPON_ERROR);
  return { ...coupon, code: normalized };
}

/** Same as quoteCoupon. Kept so the quote route reads the same as before. */
export const previewCoupon = quoteCoupon;
