"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Bitcoin, Loader2 } from "lucide-react";

import BitcoinPanel from "@/components/BitcoinPanel";
import type { PaymentSession } from "@/lib/payments/types";

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
    <section className="checkout-page__methods" aria-label="Payment methods">
      <h2>How would you like to pay?</h2>
      <ul className="checkout-methods">
        {usable.map((method) => (
          <li key={method.key}>
            <button
              type="button"
              className="checkout-methods__option"
              onClick={startBitcoin}
              disabled={starting}
              aria-busy={starting}
            >
              <span className="checkout-methods__icon" aria-hidden="true">
                {starting ? <Loader2 size={20} className="booking-widget__spin" /> : <Bitcoin size={20} />}
              </span>
              <span className="checkout-methods__text">
                <strong>{method.name}</strong>
                <span>{method.detail}</span>
              </span>
              {method.demo && <span className="checkout-page__badge checkout-page__badge--demo">Demo</span>}
            </button>
          </li>
        ))}
      </ul>

      {message && (
        <p className="checkout-page__error" role="alert">
          <AlertCircle size={15} aria-hidden="true" />
          <span>{message}</span>
        </p>
      )}
    </section>
  );
}
