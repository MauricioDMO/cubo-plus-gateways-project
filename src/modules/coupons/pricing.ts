export type CouponKind = "percent" | "amount";

export type CouponQuote = {
  kind: CouponKind;
  /** Percent 1–100, or a dollar amount for kind=amount. */
  value: number;
};

export function couponDiscountCents(subtotalCents: number, coupon: CouponQuote): number {
  if (!Number.isFinite(subtotalCents) || subtotalCents <= 0) return 0;
  if (!Number.isFinite(coupon.value) || coupon.value <= 0) return 0;
  if (coupon.kind === "percent") {
    const percent = Math.min(100, coupon.value);
    return Math.min(subtotalCents, Math.round((subtotalCents * percent) / 100));
  }
  const amountCents = Math.round(coupon.value * 100);
  return Math.min(subtotalCents, amountCents);
}
