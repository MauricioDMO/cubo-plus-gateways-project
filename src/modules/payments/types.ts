/*
 * The payment contract students implement. See TASK.md for the full assignment.
 *
 * A provider creates a payment for a booking's total and reports on it later.
 * It never confirms a booking by itself: when a payment is really paid, the
 * provider calls markPaid(paymentId) from modules/bookings/server/booking-store.ts. That is the
 * only way a booking becomes "confirmed".
 */

export type PaymentSession = {
  /** Provider's id for this payment. Stored on the booking as payment_reference. */
  id: string;
  /** The booking this payment is for. */
  bookingId: number;
  /** What the guest must pay, in US cents. Taken from the booking's quoted total. */
  amountCents: number;
  currency: "USD";
  btc?: {
    /** On-chain address to pay. */
    address?: string;
    /** Lightning invoice (BOLT11 or similar) to pay. */
    invoice?: string;
    /** The USD amount converted to satoshis at the rate you chose. */
    amountSats?: number;
    /** ISO time after which the invoice or address quote is no longer valid. */
    expiresAt?: string;
  };
  status: "pending" | "paid" | "expired" | "failed";
};

export interface PaymentProvider {
  readonly key: string;
  readonly label: string;
  createPayment(input: { bookingId: number; amountCents: number; description: string }): Promise<PaymentSession>;
  getPayment(id: string): Promise<PaymentSession | null>;
}
