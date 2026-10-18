export const PUBLIC_COUPON_ERROR = "That coupon is not valid.";

export type PublicCouponView = {
  active: boolean;
  listing_id: number | null;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
};

export type CouponLifecyclePhase = "quote" | "confirm";

/** use_count moves when the stay is paid, never when the code is only quoted. */
export function shouldIncrementCouponUseCount(phase: CouponLifecyclePhase): boolean {
  return phase === "confirm";
}

/**
 * Today's date in the business's own zone, as YYYY-MM-DD. The business is in
 * El Salvador (UTC-6, no daylight saving). Using the UTC date would end a code
 * at about 6 pm local time, so a code that expires on the 8th is good until the
 * end of the 8th there.
 */
export function businessTodayIso(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/El_Salvador",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: "year" | "month" | "day") => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** A real calendar day as YYYY-MM-DD. Rejects 2026-02-31, which would roll over into March. */
export function isIsoDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function evaluatePublicCoupon(
  coupon: PublicCouponView | null,
  listingId: number,
  today: string
): { ok: true; coupon: PublicCouponView } | { ok: false; error: typeof PUBLIC_COUPON_ERROR } {
  if (!coupon || !coupon.active) return { ok: false, error: PUBLIC_COUPON_ERROR };
  if (coupon.listing_id != null && coupon.listing_id !== listingId) {
    return { ok: false, error: PUBLIC_COUPON_ERROR };
  }
  if (coupon.expires_at && coupon.expires_at < today) {
    return { ok: false, error: PUBLIC_COUPON_ERROR };
  }
  if (coupon.max_uses != null && coupon.use_count >= coupon.max_uses) {
    return { ok: false, error: PUBLIC_COUPON_ERROR };
  }
  return { ok: true, coupon };
}

export type CouponStatus = "active" | "off" | "expired" | "used_up";

export const COUPON_STATUS_LABEL: Record<CouponStatus, string> = {
  active: "Active",
  off: "Off",
  expired: "Expired",
  used_up: "Used up",
};

/**
 * The word the owner reads in the coupon list. Off wins over the rest: a code
 * that is switched off is off whatever its dates say.
 */
export function couponStatus(coupon: PublicCouponView, today: string): CouponStatus {
  if (!coupon.active) return "off";
  if (coupon.expires_at && coupon.expires_at < today) return "expired";
  if (coupon.max_uses != null && coupon.use_count >= coupon.max_uses) return "used_up";
  return "active";
}

export function payableTotalAfterDiscount(subtotalCents: number, discountCents: number): number | null {
  if (!Number.isFinite(subtotalCents) || !Number.isFinite(discountCents)) return null;
  const next = subtotalCents - discountCents;
  if (!Number.isInteger(next) || next <= 0) return null;
  return next;
}

export function couponAppliedNote(code: string, discountCents: number): string {
  return `Coupon ${code} (−$${(discountCents / 100).toFixed(2)})`;
}

export function couponCodeFromNotes(notes: string | null | undefined): string | null {
  if (!notes) return null;
  // Hyphens are allowed in a code, so the code runs to the space before the amount, not to a word boundary.
  const match = notes.match(/(?:^| · )Coupon ([A-Z0-9][A-Z0-9-]{2,})(?=\s|$)/);
  return match?.[1] ?? null;
}

export function canRedeemCouponUse(useCount: number, maxUses: number | null): boolean {
  if (maxUses == null) return true;
  return useCount < maxUses;
}
