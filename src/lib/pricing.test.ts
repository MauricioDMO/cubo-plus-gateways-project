import { describe, expect, it } from "vitest";
import { couponDiscountCents } from "./pricing";

describe("couponDiscountCents", () => {
  it("takes a percent off the stay, never more than the total", () => {
    expect(couponDiscountCents(10000, { kind: "percent", value: 10 })).toBe(1000);
    expect(couponDiscountCents(10000, { kind: "percent", value: 100 })).toBe(10000);
    expect(couponDiscountCents(10000, { kind: "percent", value: 150 })).toBe(10000);
  });

  it("takes a flat dollar amount off, never more than the total", () => {
    expect(couponDiscountCents(127500, { kind: "amount", value: 100 })).toBe(10000);
    expect(couponDiscountCents(5000, { kind: "amount", value: 80 })).toBe(5000);
  });
});
