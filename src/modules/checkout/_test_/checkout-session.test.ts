import { describe, expect, it } from "vitest";

import { isCheckoutSessionId, newCheckoutSessionId } from "@/modules/checkout/checkout-session";

describe("checkout session ids", () => {
  it("accepts cko_ ids only", () => {
    expect(isCheckoutSessionId("cko_12_abc")).toBe(true);
    expect(isCheckoutSessionId("cs_test_123")).toBe(false);
    expect(isCheckoutSessionId("")).toBe(false);
  });

  it("mints a cko_ id that includes the booking id", () => {
    const id = newCheckoutSessionId(42);
    expect(id.startsWith("cko_42_")).toBe(true);
    expect(isCheckoutSessionId(id)).toBe(true);
  });
});
