import { btcMockProvider } from "./btc-mock";
import type { PaymentProvider } from "./types";

export type { PaymentProvider, PaymentSession } from "./types";

/*
 * The payment provider the checkout uses. To swap in your own, import it here
 * and change this one line. Nothing else in the app needs to change.
 */
export const activePaymentProvider: PaymentProvider = btcMockProvider;
