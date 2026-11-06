"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { rememberReferral } from "./referral-session";

export default function ReferralTracker() {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");

  useEffect(() => {
    if (referralCode === null) return;

    rememberReferral(referralCode);
  }, [referralCode]);

  return null;
}