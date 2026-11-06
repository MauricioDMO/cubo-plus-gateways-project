import { reviewStay, type Review } from "../modules/referrals/reward-review.ts";
const base: Review = { policyApproved: true, status: "confirmed", completed: true,
  refunded: false, alreadyIssued: false, priorCompleted: 0, referral: "different_guest" };
const samples: [string, Partial<Review>][] = [
  ["First referred stay", {}], ["Confirmed, before departure", { completed: false }],
  ["Same guest", { referral: "self" }], ["Unverified promoter", { referral: "unknown" }],
  ["Prior credit", { alreadyIssued: true }], ["Refund", { refunded: true }],
  ["Cancelled", { status: "cancelled" }], ["Rules pending", { policyApproved: false }],
  ["Repeat guest", { priorCompleted: 1 }], ["First organic stay", { referral: "none" }],
];
console.log("Synthetic operator review. No benefits issued.");
console.table(samples.map(([example, facts]) => ({ example, decision: reviewStay({ ...base, ...facts }) })));
