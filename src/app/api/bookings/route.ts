import { NextResponse } from "next/server";

import { attachCheckoutSession, createPendingBooking, DatesUnavailableError, NotFoundError, ValidationError, type BookingInput } from "@/lib/bookings";
import { newCheckoutSessionId } from "@/lib/checkout-session";

/*
 * Starts a booking. Writes a pending booking to the local store and sends the
 * guest to the checkout page, where they see the price and pay.
 *
 * The URL in the answer is relative on purpose: it is this same site.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const input: BookingInput = {
    listing_id: Number(body.listing_id),
    check_in: String(body.check_in ?? ""),
    check_out: String(body.check_out ?? ""),
    guest_name: String(body.guest_name ?? ""),
    guest_email: String(body.guest_email ?? ""),
    guest_phone: body.guest_phone ? String(body.guest_phone) : undefined,
    guest_notes: body.guest_notes ? String(body.guest_notes) : undefined,
  };

  try {
    if (!Number.isInteger(input.listing_id) || input.listing_id <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid listing." }, { status: 400 });
    }

    const booking = await createPendingBooking(input);
    const sessionId = newCheckoutSessionId(booking.id);
    await attachCheckoutSession(booking.id, sessionId);
    return NextResponse.json({
      ok: true,
      data: { url: `/checkout?session_id=${encodeURIComponent(sessionId)}`, mode: "checkout" },
    });
  } catch (error) {
    if (error instanceof DatesUnavailableError) {
      return NextResponse.json({ ok: false, error: "dates_unavailable", message: error.message }, { status: 409 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    console.error("Unexpected error in POST /api/bookings:", error);
    return NextResponse.json({ ok: false, error: "Unexpected server error. Please try again." }, { status: 500 });
  }
}
