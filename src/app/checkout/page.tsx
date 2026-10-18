import Link from "next/link";
import { notFound } from "next/navigation";

import CheckoutExtras from "@/components/CheckoutExtras";
import CheckoutMethods, { type CheckoutMethod } from "@/components/CheckoutMethods";
import { getBookingBySessionId, getListing } from "@/lib/bookings";
import { isCheckoutSessionId } from "@/lib/checkout-session";
import { formatStayDate } from "@/lib/time";

export const dynamic = "force-dynamic";

export const metadata = { title: "Checkout - Getaways El Salvador" };

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  if (!sessionId || !isCheckoutSessionId(sessionId)) notFound();

  const booking = await getBookingBySessionId(sessionId);
  if (!booking) notFound();

  const listing = getListing(booking.listing_id);

  /*
   * The one payment method in this build. Student mock: nothing real is charged.
   * It is always marked demo outside production, so the panel shows the
   * "Simulate payment" button there.
   */
  const isDev = process.env.NODE_ENV !== "production";
  const methods: CheckoutMethod[] = [
    {
      key: "btc",
      name: "Bitcoin (student mock)",
      detail: "Pay with bitcoin. Nothing real is charged in this class project.",
      available: true,
      demo: isDev,
    },
  ];

  const nightLabel = booking.nights === 1 ? "night" : "nights";
  const awaitingPayment = booking.status === "pending_payment";
  /*
   * A payment that is already open was opened for the total stored on the
   * booking, and the quote route refuses to change that total from then on.
   * A guest who reloads gets the payment panel back at that total.
   */
  const priceLocked = Boolean(booking.payment_reference);
  /*
   * Before a quote is saved, the booking total is nights x rate with no extras
   * and no tax. The bill below is the real figure, so the summary's own Total
   * row is hidden while the bill is shown.
   */
  const pricingBelow = awaitingPayment && !priceLocked;

  return (
    <main className="checkout-page">
      <section className="checkout-page__panel" aria-labelledby="checkout-heading">
        <header className="pay-chrome">
          <div className="pay-chrome__brand">
            <span className="pay-chrome__mark" aria-hidden="true">
              G
            </span>
            <div>
              <strong>Getaways El Salvador</strong>
              <span>Secure online payment</span>
            </div>
          </div>
          {isDev && <span className="checkout-page__badge checkout-page__badge--demo">Demo</span>}
        </header>

        {isDev && (
          <p className="checkout-page__demo-banner" role="status">
            Student mock. No payment is real and nothing is charged.
          </p>
        )}

        <p className="checkout-page__eyebrow">Reservation</p>
        <h1 id="checkout-heading">Confirm your stay</h1>

        <dl className="checkout-page__summary">
          <div>
            <dt>Property</dt>
            <dd>{listing?.title ?? "Getaways stay"}</dd>
          </div>
          <div>
            <dt>Dates</dt>
            <dd>
              {formatStayDate(booking.check_in)} &ndash; {formatStayDate(booking.check_out)}
              <span className="checkout-page__nights">
                {booking.nights} {nightLabel}
              </span>
            </dd>
          </div>
          <div>
            <dt>Guest</dt>
            <dd>
              {booking.guest_name}
              <span className="checkout-page__nights">{booking.guest_email}</span>
            </dd>
          </div>
          {!pricingBelow && (
            <div className="checkout-page__summary-total">
              <dt>Total</dt>
              <dd>{money(booking.total_amount_cents)}</dd>
            </div>
          )}
        </dl>

        {booking.status === "confirmed" ? (
          <div className="checkout-page__action">
            <Link className="checkout-page__button" href={`/booking-confirmation?session_id=${encodeURIComponent(sessionId)}`}>
              View confirmation
            </Link>
          </div>
        ) : !awaitingPayment ? (
          /* Cancelled or anything else that is not waiting for money. Never the payment
             methods: a payment opened here would be taken for a stay that is already settled. */
          <section className="checkout-page__methods" aria-label="Booking status">
            <p className="checkout-page__methods-note">
              This booking is no longer waiting for payment, so there is nothing to pay here.
            </p>
            <div className="checkout-page__action">
              <Link className="checkout-page__button" href={`/booking-confirmation?session_id=${encodeURIComponent(sessionId)}`}>
                View booking status
              </Link>
            </div>
          </section>
        ) : priceLocked ? (
          <>
            <p className="checkout-page__methods-note">
              A payment is already open for this stay, so the price is set. Pick up where you left off.
            </p>
            <CheckoutMethods sessionId={sessionId} methods={methods} totalAmountCents={booking.total_amount_cents} />
          </>
        ) : (
          /* The party size, the pet and any coupon come first, and the payment method is
             handed to that component rather than rendered beside it: a guest who has not
             been quoted has not seen the price they would be charged. */
          <CheckoutExtras
            sessionId={sessionId}
            initialGuests={booking.guests ?? 1}
            methods={methods}
          />
        )}

        <Link className="checkout-page__cancel" href={listing?.slug ? `/listing/${listing.slug}` : "/"}>
          Return to property
        </Link>
      </section>
    </main>
  );
}
