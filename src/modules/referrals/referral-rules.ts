export type ReferralCode = {
  code: string;
  active: boolean;
};

export function validateReferral(
  input: string,
  referrals: ReferralCode[]
): string | null {

  const code = input.trim().toUpperCase();

  if (!/^[A-Z0-9-]{4,24}$/.test(code)) {
    return null;
  }

  const referral = referrals.find(
    (item) => item.code === code && item.active
  );

  return referral ? code : null;
}