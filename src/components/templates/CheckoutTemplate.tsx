import Link from "next/link";

import CheckoutExtras from "@/components/organisms/CheckoutExtras";
import CheckoutMethods from "@/components/organisms/CheckoutMethods";
import type { CheckoutData } from "@/modules/checkout/server/checkout";
import { formatStayDate } from "@/shared/utils/time";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default function CheckoutTemplate({ data }: { data: CheckoutData }) {
  const { sessionId, booking, listing, isDev, methods, nightLabel, awaitingPayment, priceLocked, pricingBelow } = data;

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
