import type { PublicCouponView } from "@/modules/coupons/coupon-rules";
import type { CouponQuote } from "@/modules/coupons/pricing";

export type CouponRow = CouponQuote & PublicCouponView & {
  code: string;
  note: string | null;
};
