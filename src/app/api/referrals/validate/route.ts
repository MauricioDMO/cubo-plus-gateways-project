import { NextResponse } from "next/server";

import { findActiveReferral } from "@/modules/referrals/referral-store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (typeof body?.code !== "string") {
    return NextResponse.json(
      { valid: false, error: "Invalid referral code." },
      { status: 400 }
    );
  }

  try {
    const referral = await findActiveReferral(body.code);

    return NextResponse.json({
      valid: referral !== null,
      code: referral?.code ?? null,
    });
  } catch (error) {
    console.error("Referral validation failed:", error);

    return NextResponse.json(
      { valid: false, error: "Unable to validate referral." },
      { status: 500 }
    );
  }
}