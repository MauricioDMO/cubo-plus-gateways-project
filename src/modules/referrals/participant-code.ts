import { createHmac } from "node:crypto";

// Issued codes carry a key tag so old codes fail closed after a key change.
// The account id never appears in a shareable URL.
const issued = /^R-[0-9A-F]{6}-[0-9A-F]{15}$/;
export function isParticipantCode(code: string) { return issued.test(code); }

export function participantCode(accountId: number, secret: string | undefined) {
  if (!Number.isSafeInteger(accountId) || accountId < 1 || !secret || secret.length < 32) return null;
  const digest = (value: string) => createHmac("sha256", secret).update(value).digest("hex").toUpperCase();
  return "R-" + digest("gateways:referral:key").slice(0, 6) + "-" + digest("gateways:referral:guest:" + accountId).slice(0, 15);
}

export function canAttribute(code: string, guestId: number | null, secret: string | undefined) {
  if (!isParticipantCode(code)) return true; // Existing campaign codes have no account owner.
  const own = guestId === null ? null : participantCode(guestId, secret);
  return own !== null && own.slice(0, 9) === code.slice(0, 9) && own !== code;
}
