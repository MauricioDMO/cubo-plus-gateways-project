import { normalizeReferralCode } from "./referral-rules";

const storageKey = "gateways_referral_code";

export function rememberReferral(value: string) {
  const code = normalizeReferralCode(value);
  try {
    if (code) sessionStorage.setItem(storageKey, code);
    else sessionStorage.removeItem(storageKey);
  } catch { /* The form and its URL still work when storage is blocked. */ }
}

export function readReferral(): string {
  const params = new URLSearchParams(window.location.search);
  if (params.has("ref")) return normalizeReferralCode(params.get("ref") ?? "") ?? "";
  try { return normalizeReferralCode(sessionStorage.getItem(storageKey) ?? "") ?? ""; }
  catch { return ""; }
}

// Use the displayed selection when returning from guest login, including a deliberate removal.
export function setReferralParam(params: URLSearchParams, value: string) {
  const code = normalizeReferralCode(value);
  if (code) params.set("ref", code);
  else params.delete("ref");
}
