import { NextResponse } from "next/server";

import { getBookingBySessionId } from "@/modules/bookings/server/bookings";
import { isCheckoutSessionId } from "@/modules/checkout/checkout-session";

/*
 * Lets the checkout page watch for a payment that is confirmed elsewhere.
 * The Bitcoin panel polls this. Returns the status and nothing else: no guest
 * name, email or price.
 */
export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id") ?? "";
  if (!isCheckoutSessionId(sessionId)) {
    return NextResponse.json({ ok: false, error: "Invalid checkout session." }, { status: 400 });
  }

  try {
    const booking = await getBookingBySessionId(sessionId);
    if (!booking) {
      return NextResponse.json({ ok: false, error: "Checkout session not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: { status: booking.status } });
  } catch (error) {
    console.error("Unexpected error in GET /api/checkout/status:", error);
    return NextResponse.json({ ok: false, error: "Status could not be read." }, { status: 500 });
  }
}
