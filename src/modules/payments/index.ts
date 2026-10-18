import { btcMockProvider } from "@/modules/payments/btc-mock";
import type { PaymentProvider } from "@/modules/payments/types";

export type { PaymentProvider, PaymentSession } from "@/modules/payments/types";

/*
 * The payment provider the checkout uses. To swap in your own, import it here
 * and change this one line. Nothing else in the app needs to change.
 */
export const activePaymentProvider: PaymentProvider = btcMockProvider;
