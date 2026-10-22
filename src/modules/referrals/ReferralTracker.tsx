"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ReferralTracker() {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");

  useEffect(() => {
    if (referralCode === null) return;

    const code = referralCode.trim().toUpperCase();

    try {
      if (/^[A-Z0-9-]{4,24}$/.test(code)) {
        sessionStorage.setItem(
          "gateways_referral_code",
          code
        );
      } else {
        sessionStorage.removeItem("gateways_referral_code");
      }
    } catch {
      // Storage may be unavailable in some browsers.
    }
  }, [referralCode]);

  return null;
}