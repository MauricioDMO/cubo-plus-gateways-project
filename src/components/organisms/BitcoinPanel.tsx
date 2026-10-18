"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, Check, Copy, Loader2 } from "lucide-react";
import QRCode from "qrcode";

import type { PaymentSession } from "@/modules/payments/types";

/*
 * The Bitcoin payment panel. It shows what the provider returned and waits.
 *
 * It does not decide anything about money. The page asks the server
 * (GET /api/checkout/btc) every few seconds, and when the booking is confirmed
 * it moves on. Only markPaid() on the server confirms a booking.
 *
 * Students: the amount in sats, the QR and the expiry all come from the
 * provider (modules/payments/btc-mock.ts). Add what the provider does not give
 * you here, such as a live rate or a partial-payment message.
 */

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function BitcoinPanel({
  sessionId,
  payment,
  totalAmountCents,
  demo,
  onPaid,
  onBack,
}: {
  sessionId: string;
  payment: PaymentSession;
  totalAmountCents: number;
  demo: boolean;
  onPaid: () => void;
  onBack: () => void;
}) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const paidRef = useRef(false);

  const payload = payment.btc?.invoice ?? (payment.btc?.address ? `bitcoin:${payment.btc.address}` : null);
  const copyable = payment.btc?.invoice ?? payment.btc?.address ?? null;
  const expiresAt = payment.btc?.expiresAt ? Date.parse(payment.btc.expiresAt) : null;
  const remaining = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : null;
  const expired = remaining === 0 || payment.status === "expired";

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!payload) return;
    let active = true;
    QRCode.toDataURL(payload, { errorCorrectionLevel: "M", margin: 1, width: 240 })
      .then((url) => active && setQrUrl(url))
      .catch(() => active && setQrUrl(null));
    return () => {
      active = false;
    };
  }, [payload]);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/checkout/btc?session_id=${encodeURIComponent(sessionId)}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (json?.ok && json.data?.status === "confirmed" && !paidRef.current) {
        paidRef.current = true;
        onPaid();
      }
    } catch {
      // A dropped poll is fine. The next one is three seconds away.
    }
  }, [sessionId, onPaid]);

  useEffect(() => {
    const id = setInterval(checkStatus, 3000);
    return () => clearInterval(id);
  }, [checkStatus]);

  async function copyPayload() {
    if (!copyable) return;
    try {
      await navigator.clipboard.writeText(copyable);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  // Dev only. The server refuses this in production.
  async function simulatePaid() {
    setSimulating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/checkout/btc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, action: "simulate_paid" }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setMessage(json?.error ?? "The simulation failed.");
        return;
      }
      if (json.data?.status === "confirmed" && !paidRef.current) {
        paidRef.current = true;
        onPaid();
        return;
      }
      setMessage("The booking was not confirmed. Check the dates and try again.");
    } catch {
      setMessage("The simulation failed. Check your connection.");
    } finally {
      setSimulating(false);
    }
  }

  return (
    <section className="lightning-panel" aria-label="Bitcoin payment">
      <button type="button" className="lightning-panel__back" onClick={onBack}>
        <ArrowLeft size={15} aria-hidden="true" />
        <span>Other method</span>
      </button>

      <h2>Pay with bitcoin</h2>
      <p className="lightning-panel__amount">
        <strong>{money(totalAmountCents)}</strong>
        {payment.btc?.amountSats != null && <span>{payment.btc.amountSats.toLocaleString("en-US")} sats</span>}
      </p>

      <div className="lightning-panel__qr">
        {qrUrl && !expired ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrUrl} alt="Bitcoin payment QR code" width={240} height={240} />
        ) : (
          <div className="lightning-panel__qr-fallback">{expired ? "This payment expired" : "Waiting for a payment address"}</div>
        )}
      </div>

      {remaining !== null && !expired && (
        <p className="lightning-panel__countdown">Expires in {formatCountdown(remaining)}</p>
      )}

      {copyable && !expired && (
        <div className="lightning-panel__invoice">
          <code>{copyable}</code>
          <button type="button" onClick={copyPayload} aria-label="Copy">
            {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      )}

      {!expired && (
        <p className="lightning-panel__waiting">
          <Loader2 size={14} className="booking-widget__spin" aria-hidden="true" />
          <span>Waiting for payment…</span>
        </p>
      )}

      {demo && (
        <div className="lightning-panel__demo">
          <p>
            <strong>Student mock.</strong> No real bitcoin moves here. This button marks the payment as paid so
            you can test the confirmation page. It is removed in production.
          </p>
          <div className="lightning-panel__demo-actions">
            <button type="button" onClick={simulatePaid} disabled={simulating}>
              {simulating ? "Simulating…" : "Simulate payment"}
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className="checkout-page__error" role="alert">
          <AlertCircle size={15} aria-hidden="true" />
          <span>{message}</span>
        </p>
      )}
    </section>
  );
}
