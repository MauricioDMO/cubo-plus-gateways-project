"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronDown, X } from "lucide-react";
import BookingDatePicker from "@/components/molecules/BookingDatePicker";
import { useBookingDates } from "@/modules/bookings/providers/BookingDates";
import { addDaysIso, nightsBetween, todayIso } from "@/modules/bookings/booking-dates";
import { trimShortMonth } from "@/shared/utils/time";

/*
 * The booking bar pinned to the bottom of a phone screen.
 *
 * On a phone the booking form sits below the description, the amenities and
 * the whole listing copy, so a guest who has decided has to scroll back up
 * past all of it to act. The bar is always there.
 *
 * It asks for the dates itself rather than only linking down to the form.
 * Two taps -- pick the nights, then reserve -- and the form the guest lands on
 * already holds those dates, because both read the same provider
 * (modules/bookings/providers/BookingDates.tsx). Sending someone to an empty form after they
 * have already told you when they want to come is how a booking is lost.
 *
 * Hidden above 900px in CSS, where the form is a sidebar already on screen.
 */
export default function MobileBookBar({
  nightlyRate,
  minNights,
}: {
  /** Pre-formatted, e.g. "$337" -- the page already formats it for the body copy. */
  nightlyRate: string | null;
  minNights?: string;
}) {
  const minStay = Math.max(1, Number(minNights || 1) || 1);
  const { checkIn, checkOut, setCheckIn, setCheckOut } = useBookingDates(minStay);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const bar = useRef<HTMLDivElement | null>(null);

  /*
   * Getting out of the dates panel.
   *
   * It could only be closed by pressing the same strip that opened it -- which
   * by then reads as "5 Sep - 7 Sep - 2 nights" rather than as a way out --
   * and nothing else worked: Escape closed the calendar popover but left the
   * panel, and a tap anywhere else did nothing at all. On a phone, where there
   * is no Escape key, that is a screen with no exit.
   *
   * So: Escape closes it, and so does a tap outside the bar. The visible Done
   * button below is the one a thumb actually finds; these two are for the
   * people who reach for them first.
   */
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const onOutside = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target || bar.current?.contains(target)) return;
      /*
       * The calendar is portalled to <body>, so by the DOM it is outside this
       * bar -- without this, picking a date would close the panel underneath
       * the calendar the guest is still using.
       */
      if (target.closest?.("[data-radix-popper-content-wrapper], .booking-date-popover")) return;
      setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onOutside);
    };
  }, [open]);

  /**
   * What "Reserve now" does.
   *
   * Two states, one label. If the form is off screen the bar's job is to get
   * the guest to it; if it is already on screen the bar's job is to send it.
   * Anything else leaves a primary action that sometimes does nothing.
   */
  const reserve = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById("book");
    // No target means no JavaScript answer either: let the href do what it can.
    if (!target) return;

    event.preventDefault();
    setOpen(false);

    const box = target.getBoundingClientRect();
    // On screen enough to act on: the heading and the first fields are visible
    // above the bar itself.
    const onScreen = box.top < window.innerHeight * 0.5 && box.bottom > 120;

    if (onScreen) {
      const form = target.querySelector("form");
      if (form) {
        // requestSubmit runs the form's validation and its onSubmit, unlike
        // submit(). Safari only grew it in 16, so fall back to pressing the
        // form's own button, which validates too.
        if (typeof form.requestSubmit === "function") form.requestSubmit();
        else form.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
        return;
      }
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });

    /*
     * The same hard fallback the gallery arrows carry: a smooth programmatic
     * scroll is dropped without error in some engines, and a control whose
     * whole job is to move must not depend on it. 90px is the scroll-margin
     * the anchor already declares, so the form's heading clears the header.
     */
    const from = window.scrollY;
    window.setTimeout(() => {
      if (Math.abs(window.scrollY - from) < 4) {
        window.scrollTo(0, window.scrollY + target.getBoundingClientRect().top - 90);
      }
    }, 400);
  };

  const nights = nightsBetween(checkIn, checkOut);
  const summary = `${formatShort(checkIn)} – ${formatShort(checkOut)} · ${nights} night${nights === 1 ? "" : "s"}`;

  return (
    <div className="listing-mobile-book hidden max-[900.001px]:fixed max-[900.001px]:right-0 max-[900.001px]:bottom-0 max-[900.001px]:left-0
      max-[900.001px]:z-[40] max-[900.001px]:block max-[900.001px]:pt-2.5
      max-[900.001px]:pb-[calc(10px_+_env(safe-area-inset-bottom,_0px))] max-[900.001px]:bg-background max-[900.001px]:border-t
      max-[900.001px]:border-solid max-[900.001px]:border-t-border max-[900.001px]:shadow-[0_-2px_14px_rgba(15,_23,_39,_0.1)]
      max-[900.001px]:px-4" data-open={open ? "true" : undefined} ref={bar}>
      {open && (
        <div className="max-[900.001px]:grid max-[900.001px]:grid-cols-[1fr_1fr] max-[900.001px]:mt-0 max-[900.001px]:mb-3 max-[900.001px]:mx-0
          max-[900.001px]:gap-2.5" id={panelId}>
          <div className="max-[900.001px]:col-span-full max-[900.001px]:flex max-[900.001px]:items-center max-[900.001px]:justify-between
            max-[900.001px]:text-[11px] max-[900.001px]:font-extrabold max-[900.001px]:tracking-[1px] max-[900.001px]:uppercase
            max-[900.001px]:text-muted-text max-[900.001px]:gap-3">
            <span>Your dates</span>
            <button
              type="button"
              className="max-[900.001px]:inline-flex max-[900.001px]:items-center max-[900.001px]:min-h-8.5 max-[900.001px]:bg-background
                max-[900.001px]:text-heading max-[900.001px]:[font-family:inherit] max-[900.001px]:text-[13px] max-[900.001px]:font-semibold
                max-[900.001px]:[font-style:inherit] max-[900.001px]:leading-[inherit] max-[900.001px]:[font-variant:inherit]
                max-[900.001px]:tracking-[0] max-[900.001px]:normal-case max-[900.001px]:cursor-pointer max-[900.001px]:px-3 max-[900.001px]:py-0
                max-[900.001px]:gap-1.25 max-[900.001px]:rounded-full max-[900.001px]:border max-[900.001px]:border-solid
                max-[900.001px]:border-border max-[900.001px]:active:bg-[rgba(15,_23,_39,_0.04)]"
              onClick={() => setOpen(false)}
            >
              Done
              <X size={15} aria-hidden="true" />
            </button>
          </div>
          <div className="[&>label]:text-[11px] [&>label]:font-bold [&>label]:tracking-[0.06em] [&>label]:uppercase [&>label]:text-muted-text
            max-[900.001px]:flex max-[900.001px]:min-w-0 max-[900.001px]:flex-col max-[900.001px]:text-[12px] max-[900.001px]:text-body-text
            max-[900.001px]:gap-1">
            <label htmlFor="mobile-check-in">Check-in</label>
            <BookingDatePicker id="mobile-check-in" min={todayIso()} value={checkIn} onChange={setCheckIn} />
          </div>
          <div className="[&>label]:text-[11px] [&>label]:font-bold [&>label]:tracking-[0.06em] [&>label]:uppercase [&>label]:text-muted-text
            max-[900.001px]:flex max-[900.001px]:min-w-0 max-[900.001px]:flex-col max-[900.001px]:text-[12px] max-[900.001px]:text-body-text
            max-[900.001px]:gap-1">
            <label htmlFor="mobile-check-out">Check-out</label>
            <BookingDatePicker
              id="mobile-check-out"
              min={addDaysIso(checkIn || todayIso(), minStay)}
              value={checkOut}
              onChange={setCheckOut}
            />
          </div>
        </div>
      )}

      <div className="max-[900.001px]:flex max-[900.001px]:items-center max-[900.001px]:justify-between max-[900.001px]:gap-3.5">
        <button
          type="button"
          className="max-[900.001px]:flex max-[900.001px]:flex-1 max-[900.001px]:flex-col max-[900.001px]:items-start max-[900.001px]:min-w-0
            max-[900.001px]:min-h-11 max-[900.001px]:bg-transparent max-[900.001px]:text-left max-[900.001px]:cursor-pointer
            max-[900.001px]:p-0 max-[900.001px]:gap-0.5 max-[900.001px]:border-0"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
        >
          {nightlyRate && (
            <span className="max-[900.001px]:text-[13px] max-[900.001px]:text-body-text max-[900.001px]:m-0 [&_strong]:max-[900.001px]:text-[15px]
              [&_strong]:max-[900.001px]:text-heading">
              <strong>{nightlyRate}</strong> per night
            </span>
          )}
          <span className="max-[900.001px]:flex max-[900.001px]:items-center max-[900.001px]:max-w-full max-[900.001px]:overflow-hidden
            max-[900.001px]:whitespace-nowrap max-[900.001px]:text-ellipsis max-[900.001px]:text-[13px] max-[900.001px]:text-heading
            max-[900.001px]:underline max-[900.001px]:underline-offset-[3px] max-[900.001px]:gap-1.25">
            <CalendarDays size={14} aria-hidden="true" />
            {summary}
            {/* So the strip reads as a control in both states, rather than as
                a line of text that happens to be tappable. */}
            <ChevronDown size={14} className="motion-reduce:transition-none max-[900.001px]:flex-none max-[900.001px]:ml-0.5 max-[900.001px]:text-muted-text
              max-[900.001px]:[transition:transform_200ms_ease]
              [.listing-mobile-book[data-open=true]_&]:max-[900.001px]:[transform:rotate(180deg)]" aria-hidden="true" />
          </span>
        </button>

        {/*
          Still an anchor, so it works with no JavaScript at all -- but the
          href alone was not enough, and this is why.

          Pressing it a second time did nothing. A browser only acts on a
          fragment link when the fragment CHANGES; once the address bar already
          said #book -- which it does from the first press, and on any page
          opened from a link that carried it -- the second press was inert. A
          guest sitting on the form, having filled it in, pressing the one
          button on screen labelled "Reserve now", got nothing back.

          So the click does the work: scroll to the form if it is not on
          screen, and submit it if it is. That second half is what the label
          promised all along. Empty fields make the browser's own validation
          fire and point at the first one, which is the answer to "why can't I
          book", rather than another press that changes nothing.
        */}
        <a className="max-[900.001px]:flex-none max-[900.001px]:min-h-11.5 max-[900.001px]:bg-[#394342] max-[900.001px]:text-white
          max-[900.001px]:[font-family:inherit] max-[900.001px]:text-[16px] max-[900.001px]:font-bold max-[900.001px]:[font-style:inherit]
          max-[900.001px]:leading-[inherit] max-[900.001px]:[font-variant:inherit] max-[900.001px]:no-underline
          max-[900.001px]:cursor-pointer max-[900.001px]:px-6.5 max-[900.001px]:py-3 max-[900.001px]:rounded-full max-[900.001px]:border-0" href="#book" onClick={reserve}>
          Reserve now
        </a>
      </div>
    </div>
  );
}

function formatShort(iso: string) {
  if (!iso) return "Add dates";
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return "Add dates";
  return trimShortMonth(
    new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(year, month - 1, day))
  );
}
