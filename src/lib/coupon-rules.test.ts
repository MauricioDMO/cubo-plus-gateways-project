import { describe, expect, it } from "vitest";

import {
  PUBLIC_COUPON_ERROR,
  canRedeemCouponUse,
  couponAppliedNote,
  couponCodeFromNotes,
  evaluatePublicCoupon,
  payableTotalAfterDiscount,
  shouldIncrementCouponUseCount,
  type PublicCouponView,
} from "./coupon-rules";

function coupon(overrides: Partial<PublicCouponView> = {}): PublicCouponView {
  return {
    active: true,
    listing_id: null,
    expires_at: null,
    max_uses: null,
    use_count: 0,
    ...overrides,
  };
}

describe("evaluatePublicCoupon", () => {
  it("uses one generic error for every public failure", () => {
    const today = "2026-09-05";
    const cases: Array<PublicCouponView | null> = [
      null,
      coupon({ active: false }),
      coupon({ listing_id: 2 }),
      coupon({ expires_at: "2026-09-04" }),
      coupon({ max_uses: 1, use_count: 1 }),
    ];
    for (const row of cases) {
      const verdict = evaluatePublicCoupon(row, 1, today);
      expect(verdict.ok).toBe(false);
      if (!verdict.ok) expect(verdict.error).toBe(PUBLIC_COUPON_ERROR);
    }
  });

  it("accepts an active unscoped code", () => {
    expect(evaluatePublicCoupon(coupon(), 9, "2026-09-05")).toEqual({ ok: true, coupon: coupon() });
  });
});

describe("coupon use_count lifecycle", () => {
  it("does not increment when the stay is only quoted", () => {
    expect(shouldIncrementCouponUseCount("quote")).toBe(false);
  });

  it("increments only when the stay is confirmed", () => {
    expect(shouldIncrementCouponUseCount("confirm")).toBe(true);
  });

  it("refuses a redeem that would exceed max_uses", () => {
    expect(canRedeemCouponUse(1, 1)).toBe(false);
    expect(canRedeemCouponUse(0, 1)).toBe(true);
    expect(canRedeemCouponUse(3, null)).toBe(true);
  });
});

describe("payableTotalAfterDiscount", () => {
  it("rejects a zero or negative total after the discount", () => {
    expect(payableTotalAfterDiscount(10000, 10000)).toBeNull();
    expect(payableTotalAfterDiscount(5000, 8000)).toBeNull();
    expect(payableTotalAfterDiscount(127500, 10000)).toBe(117500);
  });
});

describe("coupon notes", () => {
  it("round-trips the code written onto the booking", () => {
    const note = couponAppliedNote("LOWSEASON", 5000);
    expect(couponCodeFromNotes(note)).toBe("LOWSEASON");
    expect(couponCodeFromNotes(`Pet fee $40.00 · ${note}`)).toBe("LOWSEASON");
    expect(couponCodeFromNotes(null)).toBeNull();
  });
});
