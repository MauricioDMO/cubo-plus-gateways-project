// Reviewed by the operator. Only a proposed policy can enter the simulator.
export type Review = {
  policyApproved: boolean;
  status: "pending" | "confirmed" | "cancelled";
  completed: boolean;
  refunded: boolean;
  alreadyIssued: boolean;
  priorCompleted: number;
  referral: "different_guest" | "self" | "unknown" | "none";
};

export function reviewStay(s: Review) {
  if (!s.policyApproved) return "policy_pending";
  if (s.refunded || s.status === "cancelled") return "ineligible";
  if (!s.completed || s.status !== "confirmed") return "await_completed_stay";
  if (s.alreadyIssued) return "already_issued";
  if (!Number.isSafeInteger(s.priorCompleted) || s.priorCompleted < 0) return "verify_history";
  if (s.referral === "self") return "self_referral";
  if (s.referral === "unknown") return "verify_owner";
  if (s.priorCompleted > 0) return "review_return_benefit";
  return s.referral === "different_guest" ? "review_referrer_credit" : "first_stay";
}
