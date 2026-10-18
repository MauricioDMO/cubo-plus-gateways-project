import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, CircleSlash, SearchX, XCircle } from "lucide-react";
import type { BookingConfirmationData } from "@/modules/bookings/server/bookings";
import {
  buildConciergeHref,
  CONCIERGE_SERVICE_DETAILS,
  CONCIERGE_SERVICE_LABELS,
  type ConciergeService,
} from "@/modules/concierge/concierge-shared";
import { formatStayDate } from "@/shared/utils/time";

type ReceiptState = "confirmed" | "pending" | "cancelled" | "refunded" | "missing";

/* One shell for all six outcomes of this page, so a guest who lands here after
   a failed or half-finished payment gets the same hierarchy -- status, facts,
   next action -- as one whose booking went through. */
function ReceiptShell({
  state,
  icon,
  eyebrow,
  title,
  lede,
  children,
  actions,
  footnote,
}: {
  state: ReceiptState;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  lede: ReactNode;
  children?: ReactNode;
  actions: ReactNode;
  footnote?: ReactNode;
}) {
  return (
    <article className={`booking-receipt booking-receipt--${state}`}>
      <div className="booking-receipt__status">
        <span className="booking-receipt__icon" aria-hidden="true">
          {icon}
        </span>
        <p className="booking-receipt__eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="booking-receipt__lede">{lede}</p>
      </div>
      {children}
      <div className="booking-receipt__actions">{actions}</div>
      {footnote ? <p className="booking-receipt__footnote">{footnote}</p> : null}
    </article>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <li>
      <span className="booking-receipt__label">{label}</span>
      <span className="booking-receipt__value">{value}</span>
    </li>
  );
}

function formatDate(iso: string) {
  return formatStayDate(iso, { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

/*
 * What we offer once the stay is paid for.
 *
 * This is the one moment on the site where the guest has finished deciding and
 * has dates in hand -- and it was a dead end: a receipt, two links, nothing to
 * do next. The concierge is what we actually sell around a stay, and everything
 * it needs to start is already known here, so each of these arrives at the form
 * with the property and the dates filled in.
 *
 * Four services, not the whole catalogue: this is an offer at the end of a
 * receipt, and a list of fifteen reads as a menu to work through rather than as
 * one more thing to say yes to. The catch-all takes anyone whose plan is not on
 * the list.
 */
const AFTER_BOOKING_SERVICES = [
  "airport_transfer",
  "private_chef",
  "surf_lessons",
  "tours",
] as const satisfies readonly ConciergeService[];

function ConciergeInvitation({
  listingSlug,
  checkIn,
  checkOut,
}: {
  listingSlug?: string;
  checkIn: string;
  checkOut: string;
}) {
  return (
    <section className="receipt-concierge" aria-labelledby="receipt-concierge-title">
      <h2 className="receipt-concierge__title" id="receipt-concierge-title">
        Now the rest of the trip
      </h2>
      <p className="receipt-concierge__lede">
        Your dates are held. Tell us what you want around them and we arrange it before you land
        &mdash; the same people we use ourselves on this coast.
      </p>

      {/* An index, not a row of cards: the thing on the left, what it means
          on the right, hairlines between. The same treatment the home page
          gives the concierge. */}
      <ul className="receipt-concierge__list">
        {AFTER_BOOKING_SERVICES.map((service) => (
          <li key={service}>
            <Link
              className="receipt-concierge__service"
              href={buildConciergeHref({ service, listingSlug, checkIn, checkOut })}
            >
              <span className="receipt-concierge__label">{CONCIERGE_SERVICE_LABELS[service]}</span>
              <span className="receipt-concierge__detail">
                {CONCIERGE_SERVICE_DETAILS[service].description}
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      <Link
        className="receipt-concierge__cta"
        href={buildConciergeHref({ service: "plan_everything", listingSlug, checkIn, checkOut })}
      >
        Plan the whole stay with us
      </Link>
    </section>
  );
}

export default function BookingConfirmationTemplate({ data }: { data: BookingConfirmationData }) {
  const { sessionId, booking, listing } = data;

  const browseActions = (
    <>
      <Link className="booking-receipt__action--primary" href="/properties">
        Browse properties
      </Link>
      <Link className="booking-receipt__action--secondary" href="/contact-us">
        Contact our team
      </Link>
    </>
  );

  if (!sessionId) {
    return (
      <ReceiptShell
        state="missing"
        icon={<CircleSlash size={26} />}
        eyebrow="No booking session"
        title="Booking not found"
        lede="This page needs a checkout session to look up. If you just paid, use the link in your confirmation email — it carries the session reference."
        actions={browseActions}
      />
    );
  }

  if (!booking) {
    return (
      <ReceiptShell
        state="missing"
        icon={<SearchX size={26} />}
        eyebrow="No booking session"
        title="Booking not found"
        lede="We couldn't find a booking for that session. It may have expired before payment completed."
        actions={browseActions}
        footnote={<>Reference: {sessionId}</>}
      />
    );
  }

  if (booking.status === "pending_payment") {
    return (
      <ReceiptShell
        state="pending"
        icon={<CalendarClock size={26} />}
        eyebrow="Reservation pending"
        title="Your request is recorded"
        lede="Your dates are not confirmed yet. If you started a payment, we're waiting for the provider to confirm it; otherwise our team will contact you to arrange payment."
        actions={
          <>
            <Link
              className="booking-receipt__action--primary"
              href={`/booking-confirmation?session_id=${encodeURIComponent(sessionId)}`}
            >
              Refresh status
            </Link>
            <Link className="booking-receipt__action--secondary" href="/contact-us">
              Contact our team
            </Link>
          </>
        }
        footnote={<>Reference: {sessionId}</>}
      />
    );
  }

  if (booking.status === "cancelled") {
    /*
     * Only a booking that took money gets the money talk. An unpaid one was
     * cancelled before anything was charged, and telling that guest they had
     * been refunded would be telling them they had paid.
     *
     * A paid booking that is still "cancelled" has NOT been refunded yet: the
     * refund is on its way, or the owner still has to send it. So the text
     * promises the return, not that it already happened.
     */
    // A payment id on the row means money was sent, so the refund wording applies.
    const paid = Boolean(booking.payment_reference);
    return (
      <ReceiptShell
        state="cancelled"
        icon={<XCircle size={26} />}
        eyebrow="Booking cancelled"
        title="This booking was cancelled"
        lede={
          paid
            ? "Your payment is being returned to you in full. It can take a few days to show on your statement. If it has not arrived after that, contact our team and quote the reference below."
            : "This booking was cancelled and you were not charged. If you still want to stay with us, please pick your dates again."
        }
        actions={browseActions}
        footnote={<>Reference: {sessionId}</>}
      />
    );
  }

  return (
    <ReceiptShell
      state="confirmed"
      icon={<CheckCircle2 size={26} />}
      eyebrow="Booking confirmed"
      title="You're all set"
      lede={
        <>
          Thanks, {booking.guest_name} — your stay at{" "}
          <strong>{listing?.title ?? "your listing"}</strong> is confirmed.
        </>
      }
      actions={
        <>
          <Link
            className="booking-receipt__action--primary"
            href={listing?.slug ? `/listing/${listing.slug}` : "/properties"}
          >
            View your property
          </Link>
          <Link className="booking-receipt__action--secondary" href="/contact-us">
            Contact our team
          </Link>
        </>
      }
      footnote={<>Payment reference: {sessionId}. Confirmation email: {booking.guest_email}.</>}
    >
      <section className="booking-receipt__card" aria-label="Booking details">
        <div className="booking-receipt__card-head">
          <h2>Your reservation</h2>
          <span className="booking-receipt__reference">{sessionId}</span>
        </div>
        <ul className="booking-receipt__rows">
          <Row label="Property" value={listing?.title ?? "Your listing"} />
          <Row label="Guest" value={booking.guest_name} />
          <Row label="Check-in" value={formatDate(booking.check_in)} />
          <Row label="Check-out" value={formatDate(booking.check_out)} />
          <Row label="Nights" value={booking.nights} />
          <li className="booking-receipt__total">
            <span className="booking-receipt__label">Total paid</span>
            <span className="booking-receipt__value">{money(booking.total_amount_cents)}</span>
          </li>
        </ul>
      </section>

      {/* Only on this branch of the page: a guest whose payment is pending or
          whose dates were taken is being told something, and an offer under
          that reads as though nobody looked. */}
      <ConciergeInvitation
        listingSlug={listing?.slug ?? undefined}
        checkIn={booking.check_in}
        checkOut={booking.check_out}
      />
    </ReceiptShell>
  );
}
