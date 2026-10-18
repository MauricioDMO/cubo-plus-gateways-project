"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, BadgeCheck, Loader2, PawPrint, Tag, Users } from "lucide-react";

import CheckoutMethods, { type CheckoutMethod } from "@/components/organisms/CheckoutMethods";
import type { Quote } from "@/modules/bookings/booking-quote";

/*
 * Plain <input>, <button> and <label>, not components/atoms/ui: this page loads
 * app/globals.css and nothing else. Tailwind is not loaded on the public site,
 * so every utility class on those primitives therefore
 * generates no CSS on the public site, which is why the coupon field rendered
 * as a bare browser control -- black hairline, wrong height, a grey system
 * button beside it -- while everything around it was branded. The styling
 * lives in globals.css with the rest of the site's own CSS.
 */

/*
 * The two questions that change the price, and the bill they produce.
 *
 * A booking is created from dates alone, so the total on the checkout was the
 * dates' worth and nothing else -- no party size, no pet, no way to use a
 * code. This asks, and the payment methods stay out of sight until it has an
 * answer: somebody who has not said how many people are coming has not been
 * quoted the price they would be charged.
 *
 * Nothing here computes money. Every figure on screen came from
 * /api/checkout/quote, which prices it on the server and writes the total onto
 * the booking. The browser sends answers; the server sends amounts.
 *
 * The payment methods are rendered HERE, not passed in from the page: the page
 * is rendered before any quote exists, so a total it handed down would be the
 * stale one. They get the quoted total, and only once a quote has been saved.
 */

type QuoteResponse = {
  quote: Quote;
  /** The answers the server priced, echoed back so the screen shows what was charged. */
  guests: number;
  withPet: boolean;
  couponCode: string | null;
  couponError: string | null;
  maxGuests: number;
  baseGuests: number;
  petsAllowed: boolean;
  petFeeCents: number;
  extraGuestFeeCents: number;
  tourismRate: number;
  ivaRate: number;
};

type Answers = { guests: number; withPet: boolean; couponCode: string };

/*
 * `unchanged` says whether the booking still carries the price the guest last
 * saw. A 4xx is the server refusing before it saved anything, so it does. A
 * 5xx or a dropped connection may or may not have saved, so nothing on screen
 * can be trusted after one.
 */
type QuoteResult = { data: QuoteResponse } | { error: string; unchanged: boolean; conflict: boolean };

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default function CheckoutExtras({
  sessionId,
  initialGuests,
  methods,
}: {
  sessionId: string;
  initialGuests: number;
  /** The payment methods, revealed once the guest has confirmed a saved quote. */
  methods: CheckoutMethod[];
}) {
  const router = useRouter();
  const [guests, setGuests] = useState(Math.max(1, initialGuests || 1));
  const [withPet, setWithPet] = useState(false);
  const [code, setCode] = useState("");
  const [data, setData] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  /* A payment panel is open below. Its amount was fixed when it opened, so the
     questions above go quiet until the guest backs out of it. */
  const [paying, setPaying] = useState(false);

  /* The last quote the server saved and the screen is showing. */
  const good = useRef<QuoteResponse | null>(null);
  /* What the newest question sent, so "Try again" repeats exactly that. Empty
     until the guest has asked anything: a retry of the first load sends no
     answers either, so the booking's own party size, pet and coupon are kept
     rather than overwritten with defaults. */
  const sent = useRef<Answers | undefined>(undefined);
  /* Which request owns the screen. Answers can come back out of order, and a
     slow reply to an older question must not replace a newer one. */
  const latest = useRef(0);

  /* The request only. It sets no state, which is what lets the mount effect
     call it without updating anything synchronously -- a set-state in an
     effect body is a cascading render, and the rule that flags it is right. */
  const requestQuote = useCallback(
    async (answers?: Answers): Promise<QuoteResult> => {
      try {
        const res = await fetch("/api/checkout/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            answers
              ? {
                  session_id: sessionId,
                  guests: answers.guests,
                  with_pet: answers.withPet,
                  coupon_code: answers.couponCode,
                }
              : { session_id: sessionId }
          ),
        });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.ok) return { data: json.data as QuoteResponse };
        return {
          error: typeof json?.error === "string" ? json.error : "The price could not be worked out. Please try again.",
          unchanged: res.status >= 400 && res.status < 500,
          conflict: res.status === 409,
        };
      } catch {
        return {
          error: "The price could not be worked out. Check your connection and try again.",
          unchanged: false,
          conflict: false,
        };
      }
    },
    [sessionId]
  );

  const commit = useCallback((result: QuoteResult) => {
    if ("data" in result) {
      good.current = result.data;
      setData(result.data);
      setGuests(result.data.guests);
      setWithPet(result.data.withPet);
      setError(null);
    } else {
      setError(result.error);
      const previous = good.current;
      if (result.unchanged && previous) {
        // Refused, nothing saved: the bill on screen is still what the booking
        // carries, so put the questions back to the answers that produced it.
        setGuests(previous.guests);
        setWithPet(previous.withPet);
      } else {
        // Unknown. Showing the old bill, or offering to pay it, could charge a
        // figure that is not the one on screen, so neither stays.
        good.current = null;
        setData(null);
      }
    }
    setLoading(false);
  }, []);

  /* A new question. Only ever called from an event handler. */
  const apply = useCallback(
    async (answers?: Answers) => {
      const id = ++latest.current;
      sent.current = answers;
      // The guest agreed to a figure, and this is no longer that figure.
      setConfirmed(false);
      setPaying(false);
      setLoading(true);
      const result = await requestQuote(answers);
      if (id !== latest.current) return;
      commit(result);
      // 409: the booking moved on (a payment is open, or it is no longer
      // waiting for money). The server render knows which, and shows it.
      if ("error" in result && result.conflict) router.refresh();
    },
    [requestQuote, commit, router]
  );

  /*
   * Priced once on arrival, so the breakdown is on screen before anybody
   * touches anything. No answers are sent: the server starts from what the
   * booking already holds.
   *
   * The request is started here and every state update happens in the
   * callback, guarded by `active`. Nothing is set while the effect runs, and
   * nothing is set into a component that has already gone.
   */
  useEffect(() => {
    let active = true;
    const id = ++latest.current;
    requestQuote().then((result) => {
      if (!active || id !== latest.current) return;
      commit(result);
    });
    return () => {
      active = false;
    };
  }, [requestQuote, commit]);

  /* From the saved quote, so the chip can only say "applied" about a code the
     booking actually carries. */
  const appliedCode = data?.couponCode ?? "";

  function change(next: { guests?: number; withPet?: boolean }) {
    const guestsNext = next.guests ?? guests;
    const petNext = next.withPet ?? withPet;
    setGuests(guestsNext);
    setWithPet(petNext);
    void apply({ guests: guestsNext, withPet: petNext, couponCode: appliedCode });
  }

  const quote = data?.quote;
  const maxGuests = data?.maxGuests || 0;
  const guestChoices = Array.from({ length: Math.max(maxGuests || guests, guests) }, (_, i) => i + 1);
  /* Nothing to change while a price is being worked out, while a payment is
     open, or when there is no saved quote to change: a failed one leaves only
     "Try again", never a half-working form. */
  const locked = loading || paying || !data;

  return (
    <section className="checkout-extras" aria-label="Your stay">
      <h2>Before you pay</h2>

      {paying && (
        <p className="checkout-page__methods-note">
          The price is set while a payment is open.
        </p>
      )}

      <div className="checkout-extras__question">
        <label htmlFor="checkout-guests">
          <Users size={16} aria-hidden="true" /> How many guests?
        </label>
        <select
          className="checkout-extras__field"
          id="checkout-guests"
          value={guests}
          onChange={(event) => change({ guests: Number(event.target.value) })}
          disabled={locked}
        >
          {guestChoices.map((count) => (
            <option key={count} value={count}>
              {count} {count === 1 ? "guest" : "guests"}
            </option>
          ))}
        </select>
        {data && data.extraGuestFeeCents > 0 && (
          <small>
            The rate covers {data.baseGuests}. Each guest above that is{" "}
            {money(data.extraGuestFeeCents)} a night.
          </small>
        )}
      </div>

      {data?.petsAllowed && (
        <div className="checkout-extras__question">
          <span className="checkout-extras__legend">
            <PawPrint size={16} aria-hidden="true" /> Bringing a pet?
          </span>
          <div className="checkout-extras__choices">
            {[
              { value: false, label: "No pets" },
              { value: true, label: "Yes, one pet" },
            ].map((option) => (
              <label
                key={String(option.value)}
                className={`checkout-extras__choice${withPet === option.value ? " checkout-extras__choice--on" : ""}`}
              >
                <input
                  type="radio"
                  name="with-pet"
                  checked={withPet === option.value}
                  onChange={() => change({ withPet: option.value })}
                  disabled={locked}
                />
                {option.label}
              </label>
            ))}
          </div>
          {data.petFeeCents > 0 && <small>{money(data.petFeeCents)} once for the stay.</small>}
        </div>
      )}

      <div className="checkout-extras__question checkout-extras__coupon-block">
        <label htmlFor="checkout-coupon">
          <Tag size={16} aria-hidden="true" /> Coupon code
        </label>

        {/* Once a code is on the booking the field is replaced by the code
            itself: leaving an editable box holding text that has already been
            spent reads as "not applied yet", and the discount is on the bill
            below either way. */}
        {appliedCode && !data?.couponError ? (
          <p className="checkout-extras__coupon-applied">
            <BadgeCheck size={17} aria-hidden="true" />
            <strong>{appliedCode}</strong>
            <span>applied</span>
            <button
              type="button"
              className="checkout-extras__coupon-remove"
              onClick={() => {
                setCode("");
                void apply({ guests, withPet, couponCode: "" });
              }}
              disabled={locked}
            >
              Remove
            </button>
          </p>
        ) : (
          <div className="checkout-extras__coupon">
            <input
              className="checkout-extras__field checkout-extras__field--code"
              id="checkout-coupon"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="GETAWAYS10"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              readOnly={paying}
              /* Enter applies the code instead of doing nothing: this is not
                 inside a <form>, so there is no implicit submit to inherit. */
              onKeyDown={(event) => {
                if (event.key !== "Enter" || !code.trim() || locked) return;
                event.preventDefault();
                void apply({ guests, withPet, couponCode: code });
              }}
            />
            <button
              type="button"
              className="checkout-extras__apply"
              onClick={() => {
                void apply({ guests, withPet, couponCode: code });
              }}
              disabled={locked || !code.trim()}
            >
              Apply
            </button>
          </div>
        )}

        {data?.couponError && (
          <small className="checkout-extras__coupon-error">
            <AlertCircle size={14} aria-hidden="true" />
            <span>{data.couponError}</span>
          </small>
        )}
      </div>

      {quote && (
        <dl className="checkout-extras__bill">
          {quote.lines.map((line) => (
            <div key={line.label}>
              <dt>{line.label}</dt>
              <dd>{money(line.amountCents)}</dd>
            </div>
          ))}
          <div className="checkout-extras__bill-subtotal">
            <dt>Subtotal</dt>
            <dd>{money(quote.subtotalCents)}</dd>
          </div>
          {quote.discountCents > 0 && (
            <div className="checkout-extras__bill-discount">
              <dt>Discount{appliedCode ? ` (${appliedCode})` : ""}</dt>
              <dd>−{money(quote.discountCents)}</dd>
            </div>
          )}
          {/* Two lines, not one "Taxes" figure. They are two different taxes
              at two different rates, the rate sheet quotes them as "13+5", and
              a guest asking what they paid should be able to read the answer
              off the bill. */}
          {/* The rate the property is charged, and not at all on a special
              price: its taxes are inside it, so the row would read $0.00. */}
          {quote.taxCents > 0 && (
            <div>
              <dt>IVA ({Math.round((data?.ivaRate ?? 0) * 100)}%)</dt>
              <dd>{money(quote.taxCents)}</dd>
            </div>
          )}
          {quote.tourismCents > 0 && (
            <div>
              <dt>Tourism tax ({Math.round((data?.tourismRate ?? 0) * 100)}%)</dt>
              <dd>{money(quote.tourismCents)}</dd>
            </div>
          )}
          <div className="checkout-extras__bill-total">
            <dt>Total</dt>
            <dd>{money(quote.totalCents)}</dd>
          </div>
        </dl>
      )}

      {error && (
        <p className="checkout-page__error" role="alert">
          <AlertCircle size={15} aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      {/* No quote and nothing in flight: either the first one failed or a later
          one did and the old bill was dropped. There is no figure to pay, so
          the only way forward is to ask again. */}
      {!quote && !loading && (
        <button type="button" className="checkout-extras__apply" onClick={() => void apply(sent.current)}>
          Try again
        </button>
      )}

      {!confirmed && (loading || quote) && (
        <button
          type="button"
          className="checkout-page__button checkout-extras__confirm"
          onClick={() => setConfirmed(true)}
          disabled={loading || !quote}
          aria-busy={loading}
        >
          {loading ? <Loader2 size={16} className="booking-widget__spin" aria-hidden="true" /> : null}
          {loading || !quote ? "Working out the price" : `Confirm ${money(quote.totalCents)} and choose payment`}
        </button>
      )}

      {/* Shown only for a quote the server has saved and the guest has agreed
          to, and handed that quote's total. The amount a panel shows is the
          amount on the booking, because the booking was just written with it. */}
      {confirmed && !loading && quote && (
        <div className="checkout-extras__payment">
          <CheckoutMethods
            sessionId={sessionId}
            methods={methods}
            totalAmountCents={quote.totalCents}
            onPanelChange={setPaying}
          />
        </div>
      )}
    </section>
  );
}
