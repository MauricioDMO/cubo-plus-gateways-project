import { expect, it } from "vitest";
import { canAttribute, participantCode } from "../participant-code";
import { reviewStay, type Review } from "../reward-review";

it("binds stable invitation links to a guest and fails closed after a key change", () => {
  const secret = "test-only-".repeat(5);
  const code = participantCode(7, secret)!;
  expect(code).toMatch(/^[A-Z0-9-]{4,24}$/);
  expect(participantCode(7, secret)).toBe(code);
  expect(canAttribute(code, 7, secret)).toBe(false);
  expect(canAttribute(code, 8, secret)).toBe(true);
  expect(canAttribute(code, 8, "other-key".repeat(6))).toBe(false);
  expect(canAttribute(code, null, secret)).toBe(false);
  expect(canAttribute("GETAWAYSDEMO", 7, undefined)).toBe(true);
});
it("qualifies only verified stays and separates acquisition from return", () => {
  const base: Review = { policyApproved: true, status: "confirmed", completed: true,
    refunded: false, alreadyIssued: false, priorCompleted: 0, referral: "different_guest" };
  expect(reviewStay(base)).toBe("review_referrer_credit");
  expect(reviewStay({ ...base, priorCompleted: 1 })).toBe("review_return_benefit");
  expect(reviewStay({ ...base, completed: false })).toBe("await_completed_stay");
  expect(reviewStay({ ...base, refunded: true })).toBe("ineligible");
  expect(reviewStay({ ...base, alreadyIssued: true })).toBe("already_issued");
  expect(reviewStay({ ...base, referral: "self" })).toBe("self_referral");
});
