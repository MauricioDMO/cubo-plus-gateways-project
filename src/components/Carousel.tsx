"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "./icons";

/*
 * Horizontally-scrollable row + arrow buttons for the homepage's "Top
 * Properties" section (Task 29). The live site renders that block
 * (`.hp-listings--slider`, confirmed via devtools on
 * getawayselsalvador.com) as a Slick carousel: one scrollable row with
 * left/right arrow buttons, ~3 cards visible at a time and the next one
 * peeking in at the edge to hint there's more to scroll. "From the Blog"
 * just below it on the live site (`.hp-posts`, no `--slider`/`content-slider`
 * class) is confirmed NOT a slider, so that section stays a plain grid in
 * app/page.tsx and this component is used nowhere else.
 *
 * Rebuilt here as a native `overflow-x: auto` row with CSS scroll-snap
 * rather than pulling in a JS carousel library: the arrows just nudge the
 * browser's own scroll position with `scrollBy(...)`, so there is no
 * slide-index state to keep in sync. Two simplifications versus the live
 * slider: it does not loop (clicking "next" past the last card simply stops,
 * rather than the live site's clone-slide infinite loop), and the arrows
 * disable at the ends instead of also looping -- both reasonable for a
 * 6-card row.
 *
 * This is the only interactive piece of an otherwise server-rendered
 * section: the caller (a server component) passes the fully server-rendered
 * cards in as `children`, following the minimal-client-boundary pattern
 * MobileNav/NavLink established for the header (Task 27) -- only the scroll
 * container and arrow buttons need the client runtime.
 */

export default function Carousel({
  children,
  trackClassName,
  label,
}: {
  children: React.ReactNode;
  /** Extra class for the scrollable track, e.g. reusing an existing card-gap/layout class. */
  trackClassName?: string;
  /** Used to build the arrow buttons' accessible names, e.g. "Top Properties". */
  label: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // 1px of tolerance for sub-pixel scroll-position rounding, so the arrows
  // don't flicker "still enabled" right at the ends of the row.
  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollPrev(el.scrollLeft > 1);
    setCanScrollNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollByDirection = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    // Roughly one viewport's worth of cards per click -- the "next page of
    // the slider" feel of the live carousel, without hardcoding a card width.
    const distance = direction * el.clientWidth * 0.9;
    const from = el.scrollLeft;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: distance, behavior: reduced ? "auto" : "smooth" });

    /*
     * The hard fallback every other scroller on this site carries: a smooth
     * programmatic scroll returns without error and moves nothing in some
     * engines -- measured in this codebase more than once. This arrow was the
     * last one without it, so if nothing has happened shortly after, go there
     * anyway.
     */
    window.setTimeout(() => {
      if (Math.abs(el.scrollLeft - from) < 4) {
        el.scrollLeft = Math.max(0, Math.min(from + distance, el.scrollWidth - el.clientWidth));
      }
    }, 400);
  };

  return (
    <div className="carousel">
      <button
        type="button"
        className="carousel__arrow carousel__arrow--prev"
        aria-label={`Scroll ${label} left`}
        onClick={() => scrollByDirection(-1)}
        disabled={!canScrollPrev}
      >
        <ArrowLeftIcon />
      </button>
      <div
        className={["carousel__track", trackClassName].filter(Boolean).join(" ")}
        ref={trackRef}
      >
        {children}
      </div>
      <button
        type="button"
        className="carousel__arrow carousel__arrow--next"
        aria-label={`Scroll ${label} right`}
        onClick={() => scrollByDirection(1)}
        disabled={!canScrollNext}
      >
        <ArrowRightIcon />
      </button>
    </div>
  );
}
