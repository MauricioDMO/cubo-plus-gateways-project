"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Bitcoin, Loader2 } from "lucide-react";

import BitcoinPanel from "@/components/organisms/BitcoinPanel";
import type { PaymentSession } from "@/modules/payments/types";

/*
 * The payment choice. The class build has one method: Bitcoin (student mock).
 * Its panel is BitcoinPanel; the server side is app/api/checkout/btc.
 */

export type CheckoutMethod = {
  key: string;
  name: string;
  detail: string;
  available: boolean;
  demo: boolean;
};

export default function CheckoutMethods({
  sessionId,
  methods,
  totalAmountCents,
  onPanelChange,
}: {
  sessionId: string;
  methods: CheckoutMethod[];
  /** The quoted total the booking carries. The panel shows this figure. */
  totalAmountCents: number;
  /** Told when the payment panel opens or closes, so the price questions above can lock while it is open. */
  onPanelChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [payment, setPayment] = useState<PaymentSession | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const usable = methods.filter((method) => method.available);
  const demo = usable.some((method) => method.demo);

  function goToConfirmation() {
    router.push(`/booking-confirmation?session_id=${encodeURIComponent(sessionId)}`);
  }

  async function startBitcoin() {
    setStarting(true);
    setMessage(null);
    // Lock the price questions from the click: the payment is opened for the total on the booking now.
    onPanelChange?.(true);
    let opened = false;
    try {
      const res = await fetch("/api/checkout/btc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setMessage(json?.error ?? "The payment could not be opened.");
        return;
      }
      setPayment(json.data.payment as PaymentSession);
      opened = true;
    } catch {
      setMessage("The payment could not be opened. Check your connection.");
    } finally {
      if (!opened) onPanelChange?.(false);
      setStarting(false);
    }
  }

  if (payment) {
    return (
      <BitcoinPanel
        sessionId={sessionId}
        payment={payment}
        totalAmountCents={totalAmountCents}
        demo={demo}
        onPaid={goToConfirmation}
        onBack={() => {
          setPayment(null);
          onPanelChange?.(false);
        }}
      />
    );
  }

  return (
    <section className="[&_h2]:mt-0 [&_h2]:mb-3 [&_h2]:text-[15px] [&_h2]:tracking-[0.2px] [&_h2]:mx-0 [&_ul]:flex [&_ul]:flex-col [&_ul]:mt-0
      [&_ul]:mb-3.5 [&_ul]:list-none [&_ul]:mx-0 [&_ul]:p-0 [&_ul]:gap-2.5 [&_li]:flex [&_li]:items-center [&_li]:justify-between
      [&_li]:px-4 [&_li]:py-3.5 [&_li]:gap-4 [&_li]:rounded-[8px] [&_li]:border [&_li]:border-solid [&_li]:border-border [&_li_div]:flex
      [&_li_div]:flex-col [&_li_div]:min-w-0 [&_li_div]:gap-0.75 [&_strong]:text-[15px] [&_strong]:text-text
      [&_li_span:not(.checkout-page\_\_badge)]:text-[13px] [&_li_span:not(.checkout-page\_\_badge)]:leading-[1.45]
      [&_li_span:not(.checkout-page\_\_badge)]:text-body-text [&_li]:max-[480.001px]:flex-col [&_li]:max-[480.001px]:items-start" aria-label="Payment methods">
      <h2>How would you like to pay?</h2>
      <ul className="flex flex-col mt-0 mb-5 list-none mx-0 p-0 gap-2.5">
        {usable.map((method) => (
          <li key={method.key}>
            <button
              type="button"
              className="flex items-center w-full bg-white text-left cursor-pointer [transition:border-color_0.12s,_box-shadow_0.12s] p-4 gap-3.5
                rounded-[10px] border border-solid border-border [&:hover:not(:disabled)]:shadow-[0_2px_10px_rgba(15,_23,_39,_0.08)]
                [&:hover:not(:disabled)]:border-heading disabled:cursor-progress disabled:opacity-70"
              onClick={startBitcoin}
              disabled={starting}
              aria-busy={starting}
            >
              <span className="grid place-items-center flex-none w-10 h-10 bg-[rgba(15,_23,_39,_0.06)] text-heading rounded-full" aria-hidden="true">
                {starting ? <Loader2 size={20} className="grow-0 shrink-0 basis-5.5 w-5.5 [animation:booking-spin_0.9s_linear_infinite] motion-reduce:[animation-duration:2.4s]" /> : <Bitcoin size={20} />}
              </span>
              <span className="flex flex-col min-w-0 flex-1 gap-0.75 [&_strong]:text-[15px] [&_strong]:text-text [&_span]:text-[13px] [&_span]:leading-[1.45]
                [&_span]:text-body-text">
                <strong>{method.name}</strong>
                <span>{method.detail}</span>
              </span>
              {method.demo && <span className="checkout-page__badge flex-none self-start bg-accent text-heading text-[11px] font-bold tracking-[0.5px] uppercase whitespace-nowrap
                px-2.5 py-1 rounded-full [&&]:bg-[#7a5206] [&&]:text-white">Demo</span>}
            </button>
          </li>
        ))}
      </ul>

      {message && (
        <p className="flex items-start mt-3 mb-0 text-[13px] leading-[1.5] text-[#8a1c2b] mx-0 gap-2 [&_svg]:flex-none [&_svg]:mt-0.5" role="alert">
          <AlertCircle size={15} aria-hidden="true" />
          <span>{message}</span>
        </p>
      )}
    </section>
  );
}
