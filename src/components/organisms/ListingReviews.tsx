"use client";

import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

import { reviewSummary, type ListingReview } from "@/modules/listings/listing-reviews";

/*
 * Guest reviews under the photo tour. Real ones -- see modules/listings/listing-reviews.ts.
 *
 * The strip drifts on its own, the same way the hero gallery does, and for the
 * same reason: a row that never moves reads as a wall of text nobody scrolls,
 * and a row that jumps a card every few seconds reads as an advert. This
 * glides one pixel at a time and stops the moment anyone touches it.
 *
 * Everything the gallery learned is reused here rather than re-discovered:
 *   - the list is rendered twice, so the drift can wrap with nothing to see;
 *   - a finger has no hover, so touch/pointer/wheel all hold the drift off for
 *     a while rather than only while held;
 *   - the arrows never disable, because the strip loops;
 *   - a smooth programmatic scroll is silently dropped in some engines, so
 *     every arrow press carries a hard fallback.
 */

/**
 * Pixels per second.
 *
 * 48, not 22. A browser stores a scroll offset on a device-pixel grid -- 0.8px
 * here -- so at 22px/s the 0.36px a frame asks for landed on that grid only
 * every second or third frame: measured 0.8, 0.8, 0.8, 0, 0.8 … which is a
 * stutter, not a drift. At 48 a 60Hz frame advances exactly one grid step and
 * the hero gallery's strip, which never stuttered, runs faster still.
 */
const DRIFT_PX_PER_SECOND = 48;

/** How long the strip stays still after somebody touches it. */
const IDLE_MS = 2600;

export default function ListingReviews({ reviews }: { reviews: ListingReview[] }) {
  const scroller = useRef<HTMLDivElement | null>(null);
  const band = useRef<HTMLDivElement | null>(null);
  /* Refs, not state: the frame loop reads these sixty times a second and a
     re-render per hover would be pure waste. */
  const paused = useRef(false);
  const resumeAt = useRef(0);
  /** The last position the DRIFT wrote; anything else is somebody scrolling. */
  const written = useRef(-1);
  /*
   * The drift's own position, in floating point.
   *
   * Not read back from scrollLeft each frame: at 22px per second a frame is
   * 0.36px, the element rounds what it stores, and the fraction was lost every
   * time -- measured, 1px of travel in a second and a half where 33 was asked
   * for. The accumulator keeps the fraction and the element gets the rounded
   * value.
   */
  const offset = useRef(0);

  /*
   * A short list does not loop.
   *
   * Sun & Salt has one review and Salty Soul has two. Duplicated for the seam,
   * one review became the same card twice side by side, which reads as a
   * mistake -- and there is nothing to scroll to anyway: two cards fit the
   * measure at any width this page has. Three is where a copy starts being
   * hidden off the edge and a drift has somewhere to go.
   */
  const looping = reviews.length >= 3;

  const holdOff = useCallback(() => {
    resumeAt.current = performance.now() + IDLE_MS;
  }, []);

  const onScroll = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    if (Math.abs(el.scrollLeft - written.current) > 2) {
      holdOff();
      // Continue from where the guest left the strip, not from where the
      // drift had got to.
      offset.current = el.scrollLeft;
    }
  }, [holdOff]);

  /** Width of one copy of the list, which is where the drift wraps. */
  const loopWidth = useCallback(() => {
    const el = scroller.current;
    if (!el || !looping) return 0;
    return el.scrollWidth / 2;
  }, [looping]);

  const step = useCallback(() => {
    const el = scroller.current;
    const card = el?.querySelector(".listing-reviews__card");
    if (!el || !card) return 0;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap || "0") || 0;
    return card.getBoundingClientRect().width + gap;
  }, []);

  const scrollByCards = useCallback(
    (direction: 1 | -1) => {
      const el = scroller.current;
      if (!el) return;
      const distance = step();
      if (distance <= 0) return;

      holdOff();

      const loop = loopWidth();
      let index = Math.round(el.scrollLeft / distance);

      /* Going left from the first card: the strip is the same reviews twice,
         so one copy along is the identical card in the identical place. Jump
         there silently rather than disabling the arrow. */
      if (direction === -1 && el.scrollLeft <= 2 && loop > distance) {
        const copies = Math.floor(loop / distance);
        el.scrollLeft = copies * distance;
        written.current = el.scrollLeft;
        index = copies;
      }

      const target = Math.max(0, (index + direction) * distance);
      const from = el.scrollLeft;
      if (Math.abs(target - from) < 1) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollTo({ left: target, behavior: reduced ? "auto" : "smooth" });
      window.setTimeout(() => {
        if (Math.abs(el.scrollLeft - from) < 1) el.scrollLeft = target;
        written.current = el.scrollLeft;
        offset.current = el.scrollLeft;
      }, 350);
    },
    [holdOff, loopWidth, step]
  );

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let previous = 0;

    const tick = (now: number) => {
      frame = window.requestAnimationFrame(tick);
      const delta = previous ? now - previous : 0;
      previous = now;

      if (paused.current || document.hidden) return;
      // Somebody is scrolling, or just finished: their momentum owns the strip.
      if (now < resumeAt.current) return;

      const loop = loopWidth();
      if (loop <= 0) return;

      // Capped: a tab returning from the background hands back an enormous
      // delta, which would fling the strip instead of resuming it.
      const elapsed = Math.min(delta, 100);
      offset.current += (DRIFT_PX_PER_SECOND * elapsed) / 1000;
      // The seam: one copy along is the same review in the same place, so
      // stepping back by exactly one copy cannot be seen.
      if (offset.current >= loop) offset.current -= loop;
      el.scrollLeft = offset.current;
      written.current = el.scrollLeft;
    };

    frame = window.requestAnimationFrame(tick);

    /*
     * Plain DOM listeners for hover and focus.
     *
     * React synthesizes onMouseEnter/onMouseLeave out of mouseover/mouseout,
     * so a dispatched `mouseenter` never reaches a JSX handler -- which made
     * the pause impossible to test and easy to get silently wrong. These fire
     * for a real cursor and for a dispatched event alike.
     */
    const hold = () => {
      paused.current = true;
    };
    const release = () => {
      paused.current = false;
    };
    const element = band.current;
    element?.addEventListener("mouseenter", hold);
    element?.addEventListener("mouseleave", release);
    element?.addEventListener("focusin", hold);
    element?.addEventListener("focusout", release);

    return () => {
      window.cancelAnimationFrame(frame);
      element?.removeEventListener("mouseenter", hold);
      element?.removeEventListener("mouseleave", release);
      element?.removeEventListener("focusin", hold);
      element?.removeEventListener("focusout", release);
    };
  }, [loopWidth]);

  if (reviews.length === 0) return null;

  const { count, average } = reviewSummary(reviews);
  // Twice, so the drift wraps with nothing to see. The copy is hidden from
  // assistive tech, which should hear each review once.
  const strip = looping
    ? [
        ...reviews.map((review) => ({ review, copy: 0 })),
        ...reviews.map((review) => ({ review, copy: 1 })),
      ]
    : reviews.map((review) => ({ review, copy: 0 }));

  return (
    <section className="max-[960.001px]:col-auto max-[960.001px]:row-auto min-[961px]:col-span-full min-[961px]:row-[4] min-w-0 mt-[clamp(56px,_6vw,_88px)]
      mb-[clamp(44px,_5vw,_64px)] pt-[clamp(38px,_4vw,_54px)] border-t border-solid border-t-border mx-0" aria-labelledby="reviews-title">
      <div className="flex items-end justify-between mb-5.5 gap-6 max-[760.001px]:block">
        <div>
          <h2 className="mt-0 mb-1.5 text-heading text-[clamp(30px,_3vw,_38px)] leading-[1.1] mx-0 [&::before]:content-[''] [&::before]:block
            [&::before]:w-11.5 [&::before]:h-1 [&::before]:mb-3.5 [&::before]:bg-button-bg [&::before]:rounded-full" id="reviews-title">
            Reviews
          </h2>
          <p className="mt-0 mb-2.5 max-w-[52ch] text-body-text text-[15px] leading-[1.5] mx-0">
            Here&rsquo;s what guests are saying about this stay.
          </p>
          <p className="flex items-center flex-wrap gap-y-1 gap-x-2.5 text-body-text text-[14px] m-0">
            <span className="inline-flex items-center font-heading text-[16px] font-semibold text-heading gap-1.25 [&_svg]:fill-accent [&_svg]:text-accent">
              <Star size={16} aria-hidden="true" />
              {average.toFixed(1)}
            </span>
            {/* The middot keeps "4.8" from reading as part of "6 reviews". */}
            <span aria-hidden="true">·</span>
            <span>
              {count} {count === 1 ? "review" : "reviews"}
            </span>
          </p>
        </div>

        {/* Desktop only in CSS: on a phone the strip is swiped. Gone entirely
            when the reviews fit, since there is nothing to arrow to. */}
        <div className="flex flex-none gap-2 max-[760.001px]:hidden" hidden={!looping}>
          <button
            type="button"
            className="grid place-items-center w-9.5 h-9.5 bg-background text-heading cursor-pointer
              [transition:border-color_160ms_ease,_background-color_160ms_ease] p-0 rounded-full border border-solid border-border
              hover:bg-[rgba(15,_23,_39,_0.04)] hover:border-heading focus-visible:[outline:2px_solid_var(--color-heading)]
              focus-visible:outline-offset-[2px]"
            onClick={() => scrollByCards(-1)}
            aria-label="Previous reviews"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="grid place-items-center w-9.5 h-9.5 bg-background text-heading cursor-pointer
              [transition:border-color_160ms_ease,_background-color_160ms_ease] p-0 rounded-full border border-solid border-border
              hover:bg-[rgba(15,_23,_39,_0.04)] hover:border-heading focus-visible:[outline:2px_solid_var(--color-heading)]
              focus-visible:outline-offset-[2px]"
            onClick={() => scrollByCards(1)}
            aria-label="Next reviews"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Hover and focus are handled by real listeners in the effect above;
          these three bubble, so JSX is fine for them. */}
      <div
        className="relative"
        ref={band}
        onPointerDown={holdOff}
        onTouchStart={holdOff}
        onWheel={holdOff}
      >
        <div className="flex overflow-x-auto [scrollbar-width:none] pb-1
          [mask-image:linear-gradient(to_right,_black_0,_black_calc(100%_-_64px),_transparent_100%)] gap-4.5 [&::-webkit-scrollbar]:hidden
          max-[760.001px]:[mask-image:linear-gradient(to_right,_black_0,_black_calc(100%_-_26px),_transparent_100%)]" ref={scroller} onScroll={onScroll}>
          {strip.map(({ review, copy }) => (
            <article
              key={`${review.guest}-${review.stayed}-${copy}`}
              className="listing-reviews__card flex flex-col grow-0 shrink-0 basis-[clamp(280px,_27vw,_360px)] bg-[#f7f4ed] p-6.5 gap-3 rounded-[14px]
                max-[760.001px]:grow-0 max-[760.001px]:shrink-0 max-[760.001px]:basis-[84%] max-[760.001px]:px-5 max-[760.001px]:py-5.5"
              aria-hidden={copy === 1 ? "true" : undefined}
            >
              <p className="listing-reviews__stars flex text-[rgba(57,_67,_66,_0.22)] m-0 gap-0.75" aria-label={`${review.rating} out of 5`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={13}
                    aria-hidden="true"
                    className={i < review.rating ? String.raw`[.listing-reviews\_\_stars_&]:text-accent [.listing-reviews\_\_stars_&]:fill-accent` : undefined}
                  />
                ))}
              </p>
              <p className="text-body-text text-[14.5px] leading-[1.6] m-0" lang={review.lang}>
                {review.body}
              </p>
              <footer className="mt-auto pt-1.5 [&_strong]:block [&_strong]:font-heading [&_strong]:text-[15px] [&_strong]:font-medium [&_strong]:text-heading
                [&_span]:block [&_span]:mt-0.5 [&_span]:text-muted-text [&_span]:text-[12.5px]">
                <strong>{review.guest}</strong>
                <span>
                  {/* Airbnb shows tenure ("11 years on Airbnb") when a guest
                      has set no city. That is not a place, so it is left out
                      and the date stands alone. */}
                  {review.from ? `${review.from} · ${review.stayed}` : review.stayed}
                </span>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
