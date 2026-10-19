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
    <main className="checkout-page min-h-[100dvh] grid place-items-center bg-[rgba(15,_23,_39,_0.03)] px-5 py-[clamp(24px,_6vw,_64px)]">
      <section className="w-[min(100%,_560px)] bg-background shadow-[0_5px_30px_rgba(7,_36,_86,_0.075)] p-[clamp(26px,_4vw,_40px)] rounded-[10px] [&_h1]:mt-0
        [&_h1]:mb-6.5 [&_h1]:text-[30px] [&_h1]:leading-[1.2] [&_h1]:mx-0" aria-labelledby="checkout-heading">
        <header className="flex items-center justify-between mt-0 mb-5 pb-4 border-b border-solid border-b-border mx-0 gap-3">
          <div className="flex items-center min-w-0 gap-3 [&_strong]:block [&_strong]:text-heading [&_strong]:text-[15px] [&_strong]:leading-[1.2]
            [&_span]:block [&_span]:text-muted-text [&_span]:text-[12px]">
            <span className="grid place-items-center flex-none w-9 h-9 bg-button-bg text-accent font-heading text-[18px] font-bold rounded-[8px]" aria-hidden="true">
              G
            </span>
            <div>
              <strong>Getaways El Salvador</strong>
              <span>Secure online payment</span>
            </div>
          </div>
          {isDev && <span className="checkout-page__badge flex-none self-start bg-accent text-heading text-[11px] font-bold tracking-[0.5px] uppercase whitespace-nowrap
            px-2.5 py-1 rounded-full [&&]:bg-[#7a5206] [&&]:text-white">Demo</span>}
        </header>

        {isDev && (
          <p className="mt-0 mb-5 bg-[rgba(255,_193,_7,_0.12)] text-[#7a5206] text-[13px] leading-[1.5] mx-0 px-3.5 py-2.5 rounded-[8px] border
            border-solid border-[rgba(178,_122,_12,_0.3)]" role="status">
            Student mock. No payment is real and nothing is charged.
          </p>
        )}

        <p className="mt-0 mb-1.5 text-[11px] font-extrabold tracking-[1px] uppercase text-link-strong mx-0">Reservation</p>
        <h1 id="checkout-heading">Confirm your stay</h1>

        <dl className="mt-0 mb-7 border-t border-solid border-t-border mx-0 p-0 [&_div]:flex [&_div]:items-baseline [&_div]:justify-between
          [&_div]:border-b [&_div]:border-solid [&_div]:border-b-border [&_div]:px-0 [&_div]:py-3.25 [&_div]:gap-5 [&_dt]:flex-none
          [&_dt]:text-[13px] [&_dt]:text-muted-text [&_dd]:flex [&_dd]:flex-col [&_dd]:items-end [&_dd]:text-right [&_dd]:text-[15px]
          [&_dd]:text-text [&_dd]:m-0 [&_dd]:gap-0.5 [&_div]:max-[480.001px]:flex-col [&_div]:max-[480.001px]:items-start
          [&_div]:max-[480.001px]:gap-1 [&_dd]:max-[480.001px]:items-start [&_dd]:max-[480.001px]:text-left">
          <div>
            <dt>Property</dt>
            <dd>{listing?.title ?? "Getaways stay"}</dd>
          </div>
          <div>
            <dt>Dates</dt>
            <dd>
              {formatStayDate(booking.check_in)} &ndash; {formatStayDate(booking.check_out)}
              <span className="text-[12px] text-muted-text">
                {booking.nights} {nightLabel}
              </span>
            </dd>
          </div>
          <div>
            <dt>Guest</dt>
            <dd>
              {booking.guest_name}
              <span className="text-[12px] text-muted-text">{booking.guest_email}</span>
            </dd>
          </div>
          {!pricingBelow && (
            <div className="[&_dt]:font-heading [&_dt]:text-[21px] [&_dt]:text-text [&_dd]:font-heading [&_dd]:text-[21px] [&_dd]:text-text">
              <dt>Total</dt>
              <dd>{money(booking.total_amount_cents)}</dd>
            </div>
          )}
        </dl>

        {booking.status === "confirmed" ? (
          <div className="mb-4">
            <Link className="checkout-page__button [&[aria-busy=true]]:cursor-progress [&[aria-busy=true]]:opacity-75 [&[aria-busy=true]:hover]:[transform:none]
              [.checkout-page_[data-slot=button]&]:flex [.checkout-page_[data-slot=button]&]:items-center
              [.checkout-page_[data-slot=button]&]:justify-center [.checkout-page_[data-slot=button]&]:w-full
              [.checkout-page_[data-slot=button]&]:min-h-13 [.checkout-page_[data-slot=button]&]:bg-button-bg
              [.checkout-page_[data-slot=button]&]:text-button-text [.checkout-page_[data-slot=button]&]:font-heading
              [.checkout-page_[data-slot=button]&]:text-[15px] [.checkout-page_[data-slot=button]&]:font-bold
              [.checkout-page_[data-slot=button]&]:no-underline [.checkout-page_[data-slot=button]&]:cursor-pointer
              [.checkout-page_[data-slot=button]&]:[transition:background-color_200ms_ease] [.checkout-page_[data-slot=button]&]:px-5
              [.checkout-page_[data-slot=button]&]:py-0 [.checkout-page_[data-slot=button]&]:gap-2.5
              [.checkout-page_[data-slot=button]&]:rounded-[8px] [.checkout-page_[data-slot=button]&]:border-0 flex items-center justify-center
              w-full min-h-13 bg-button-bg text-button-text font-heading text-[15px] font-bold no-underline cursor-pointer
              [transition:background-color_200ms_ease] px-5 py-0 gap-2.5 rounded-[8px] border-0
              [.checkout-page_[data-slot=button]&:hover:not(:disabled)]:bg-[#2b3433] hover:bg-[#2b3433] disabled:opacity-75
              disabled:cursor-progress" href={`/booking-confirmation?session_id=${encodeURIComponent(sessionId)}`}>
              View confirmation
            </Link>
          </div>
        ) : !awaitingPayment ? (
          /* Cancelled or anything else that is not waiting for money. Never the payment
             methods: a payment opened here would be taken for a stay that is already settled. */
          <section className="[&_h2]:mt-0 [&_h2]:mb-3 [&_h2]:text-[15px] [&_h2]:tracking-[0.2px] [&_h2]:mx-0 [&_ul]:flex [&_ul]:flex-col [&_ul]:mt-0
            [&_ul]:mb-3.5 [&_ul]:list-none [&_ul]:mx-0 [&_ul]:p-0 [&_ul]:gap-2.5 [&_li]:flex [&_li]:items-center [&_li]:justify-between
            [&_li]:px-4 [&_li]:py-3.5 [&_li]:gap-4 [&_li]:rounded-[8px] [&_li]:border [&_li]:border-solid [&_li]:border-border [&_li_div]:flex
            [&_li_div]:flex-col [&_li_div]:min-w-0 [&_li_div]:gap-0.75 [&_strong]:text-[15px] [&_strong]:text-text
            [&_li_span:not(.checkout-page\_\_badge)]:text-[13px] [&_li_span:not(.checkout-page\_\_badge)]:leading-[1.45]
            [&_li_span:not(.checkout-page\_\_badge)]:text-body-text [&_li]:max-[480.001px]:flex-col [&_li]:max-[480.001px]:items-start" aria-label="Booking status">
            <p className="mt-0 mb-6.5 text-[13px] leading-[1.6] text-body-text mx-0">
              This booking is no longer waiting for payment, so there is nothing to pay here.
            </p>
            <div className="mb-4">
              <Link className="checkout-page__button [&[aria-busy=true]]:cursor-progress [&[aria-busy=true]]:opacity-75 [&[aria-busy=true]:hover]:[transform:none]
                [.checkout-page_[data-slot=button]&]:flex [.checkout-page_[data-slot=button]&]:items-center
                [.checkout-page_[data-slot=button]&]:justify-center [.checkout-page_[data-slot=button]&]:w-full
                [.checkout-page_[data-slot=button]&]:min-h-13 [.checkout-page_[data-slot=button]&]:bg-button-bg
                [.checkout-page_[data-slot=button]&]:text-button-text [.checkout-page_[data-slot=button]&]:font-heading
                [.checkout-page_[data-slot=button]&]:text-[15px] [.checkout-page_[data-slot=button]&]:font-bold
                [.checkout-page_[data-slot=button]&]:no-underline [.checkout-page_[data-slot=button]&]:cursor-pointer
                [.checkout-page_[data-slot=button]&]:[transition:background-color_200ms_ease] [.checkout-page_[data-slot=button]&]:px-5
                [.checkout-page_[data-slot=button]&]:py-0 [.checkout-page_[data-slot=button]&]:gap-2.5
                [.checkout-page_[data-slot=button]&]:rounded-[8px] [.checkout-page_[data-slot=button]&]:border-0 flex items-center justify-center
                w-full min-h-13 bg-button-bg text-button-text font-heading text-[15px] font-bold no-underline cursor-pointer
                [transition:background-color_200ms_ease] px-5 py-0 gap-2.5 rounded-[8px] border-0
                [.checkout-page_[data-slot=button]&:hover:not(:disabled)]:bg-[#2b3433] hover:bg-[#2b3433] disabled:opacity-75
                disabled:cursor-progress" href={`/booking-confirmation?session_id=${encodeURIComponent(sessionId)}`}>
                View booking status
              </Link>
            </div>
          </section>
        ) : priceLocked ? (
          <>
            <p className="mt-0 mb-6.5 text-[13px] leading-[1.6] text-body-text mx-0">
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

        <Link className="block text-center text-[13px] text-body-text" href={listing?.slug ? `/listing/${listing.slug}` : "/"}>
          Return to property
        </Link>
      </section>
    </main>
  );
}
