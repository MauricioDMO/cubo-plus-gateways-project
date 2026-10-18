import { NextResponse } from "next/server";

import { getBookingBySessionId, getListing, saveQuote } from "@/modules/bookings/server/bookings";
import { priceFieldsFromAttributes, quoteStay } from "@/modules/bookings/booking-quote";
import { isCheckoutSessionId } from "@/modules/checkout/checkout-session";
import { previewCoupon } from "@/modules/coupons/server/coupons";

/*
 * What this stay costs, priced on the server.
 *
 * The checkout shows a breakdown that changes as the guest answers two
 * questions -- how many of you, and are you bringing a pet -- and possibly
 * types a coupon. The browser sends the ANSWERS, this computes the price, and
 * it writes the new total onto the booking so the payment charges the figure
 * that was on screen. Never trust a total sent from the browser.
 *
 * Coupons are only previewed here (see modules/coupons/server/coupons.ts). Nothing is spent.
 *
 * Once a payment is open (booking.payment_reference is set), the price is
 * locked. A payment is open for a fixed amount, so the party size cannot change
 * under it.
 */

type Body = {
  session_id?: unknown;
  guests?: unknown;
  with_pet?: unknown;
  coupon_code?: unknown;
};

const PAYMENT_OPEN_MESSAGE = "A payment is already open for this booking, so the price can no longer change.";

/* The save matched no row: a payment opened, or the booking moved on, between the read and the write. */
function bookingChangedResponse() {
  return NextResponse.json(
    { ok: false, error: "This booking changed while we were pricing it. Reload the page to see where it stands." },
    { status: 409 }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null;
  const sessionId = typeof body?.session_id === "string" ? body.session_id : "";
  if (!isCheckoutSessionId(sessionId)) {
    return NextResponse.json({ ok: false, error: "Invalid checkout session." }, { status: 400 });
  }

  try {
    const booking = await getBookingBySessionId(sessionId);
    if (!booking) {
      return NextResponse.json({ ok: false, error: "Checkout session not found." }, { status: 404 });
    }
    if (booking.status !== "pending_payment") {
      return NextResponse.json({ ok: false, error: "This booking is no longer awaiting payment." }, { status: 409 });
    }
    if (booking.payment_reference) {
      return NextResponse.json({ ok: false, error: PAYMENT_OPEN_MESSAGE }, { status: 409 });
    }

    const listing = getListing(booking.listing_id);
    if (!listing) {
      return NextResponse.json(
        { ok: false, error: "The price could not be worked out right now. Please try again." },
        { status: 503 }
      );
    }

    const fields = priceFieldsFromAttributes(listing.attributes);

    // What the booking already holds, for any answer the body does not give.
    const storedGuests = Number(booking.guests);
    const defaultGuests = Number.isInteger(storedGuests) && storedGuests > 0 ? storedGuests : 1;
    const defaultPet = (booking.pet_fee_cents ?? 0) > 0 && fields.petsAllowed;
    const defaultCode = booking.coupon_code?.trim() ?? "";

    let guests: number;
    if (body?.guests === undefined || body.guests === null) {
      guests = fields.maxGuests > 0 ? Math.min(defaultGuests, fields.maxGuests) : defaultGuests;
    } else {
      const requestedGuests = Number(body.guests);
      guests = Number.isFinite(requestedGuests) && requestedGuests > 0 ? Math.floor(requestedGuests) : 1;
      if (fields.maxGuests > 0 && guests > fields.maxGuests) {
        return NextResponse.json({ ok: false, error: `This property sleeps ${fields.maxGuests}.` }, { status: 400 });
      }
    }
    const withPet = typeof body?.with_pet === "boolean" ? body.with_pet : defaultPet;
    if (withPet && !fields.petsAllowed) {
      return NextResponse.json({ ok: false, error: "This property does not take pets." }, { status: 400 });
    }

    const code = typeof body?.coupon_code === "string" ? body.coupon_code.trim() : defaultCode;

    // The listing fields the client needs to draw the bill.
    const clientFields = {
      maxGuests: fields.maxGuests,
      baseGuests: fields.baseGuests,
      petsAllowed: fields.petsAllowed,
      petFeeCents: fields.petFeeCents,
      extraGuestFeeCents: fields.extraGuestFeeCents,
      tourismRate: fields.tourismRate,
      ivaRate: fields.ivaRate,
    };

    let discount: { kind: "percent" | "amount"; value: number } | null = null;
    let couponError: string | null = null;
    if (code) {
      try {
        const coupon = await previewCoupon(code, booking.listing_id);
        discount = { kind: coupon.kind, value: coupon.value };
      } catch (error) {
        // A bad code is a message beside the field, not a failed request.
        couponError = error instanceof Error ? error.message : "That coupon is not valid.";
      }
    }

    const quoteInput = {
      nights: booking.nights,
      // The rate the BOOKING was made at, so a later price edit cannot reprice a guest mid-checkout.
      pricePerNightCents: booking.price_per_night_cents || fields.pricePerNightCents,
      cleaningFeeCents: fields.cleaningFeeCents,
      baseGuests: fields.baseGuests,
      extraGuestFeeCents: fields.extraGuestFeeCents,
      petFeeCents: fields.petFeeCents,
      guests,
      withPet,
      tourismRate: fields.tourismRate,
      ivaRate: fields.ivaRate,
    };

    let quote = quoteStay({ ...quoteInput, discount });
    if (quote.totalCents <= 0 && discount) {
      couponError = "This stay still needs a payable amount.";
      discount = null;
      quote = quoteStay({ ...quoteInput, discount: null });
    }

    // The figure on screen becomes the figure the payment charges, and the row records why.
    const saved = await saveQuote(booking.id, {
      guests,
      total_amount_cents: quote.totalCents,
      cleaning_fee_cents: fields.cleaningFeeCents,
      extra_guest_fee_cents: quote.lines.find((line) => line.label.includes("extra guest"))?.amountCents ?? 0,
      pet_fee_cents: withPet ? fields.petFeeCents : 0,
      discount_cents: quote.discountCents,
      // Both taxes, so subtotal minus discount plus tax_cents is the total charged.
      tax_cents: quote.taxTotalCents,
      coupon_code: discount ? code.trim().toUpperCase() : null,
    });
    if (!saved) return bookingChangedResponse();

    return NextResponse.json({
      ok: true,
      data: {
        quote,
        guests,
        withPet,
        couponCode: discount ? code.trim().toUpperCase() : null,
        couponError,
        ...clientFields,
      },
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/checkout/quote:", error);
    return NextResponse.json({ ok: false, error: "The price could not be worked out." }, { status: 500 });
  }
}
