"use client";

import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { mediaPublicUrl } from "@/lib/media";

/*
 * The strip of photographs at the top of a property page.
 *
 * The drift is the point of it: a slow, continuous, seamless glide that stops
 * when you put the mouse on it. That is unchanged. What changed is only what
 * carries it, and why.
 *
 * It used to be a CSS marquee -- a track holding every photograph twice,
 * translated sideways for eighty seconds on a loop. That gave the glide for
 * free and cost two things. A finger has no hover, so on a phone the
 * photographs slid past and could not be stopped, which was patched by turning
 * the same element into a scroll container under (hover: none): two galleries
 * maintained as one. And a transform cannot be scrolled, so there was nowhere
 * for an arrow to take you.
 *
 * So it is a scroll container everywhere now, and the glide is a frame loop
 * nudging scrollLeft at the speed the animation ran. The photographs are still
 * rendered twice, still for the same reason: at the halfway mark the position
 * steps back by exactly one copy, which cannot be seen because what is on
 * screen is identical. The loop has no seam and never ends.
 *
 * An interval that jumped a whole photograph every few seconds was tried here
 * and is not the same thing. It ticks; this glides.
 *
 * Two things the phone taught afterwards. The glide has to yield to a finger
 * for a while, not just while it is touching -- writing scrollLeft on the next
 * frame kills a flick's momentum, which is what "stuck" meant. And the left
 * arrow must never be disabled: the strip loops, so going left from the start
 * is a jump of one copy to the identical picture, not the end of the road.
 */

type GalleryMedia = { storage_path: string; alt_text: string | null };

/** What the CSS animation took to cross one copy of the strip. */
const LOOP_SECONDS = 80;

/**
 * How long the strip stays still after somebody touches it.
 *
 * This is the fix for a strip that felt "stuck" on a phone. The glide writes
 * `scrollLeft` on every frame, and a finger has no hover to pause it with, so
 * a swipe and the glide were writing to the same property sixty times a
 * second: the flick started, the next frame overwrote it, and the momentum
 * died. Two and a half seconds is long enough that a swipe, its momentum and
 * a second swipe all land before the glide takes over again.
 */
const IDLE_MS = 2500;

export default function ListingGallery({
  media,
  title,
  children,
}: {
  media: GalleryMedia[];
  /** Fallback alt text: the property's own name, for a photograph with none. */
  title: string;
  /** The "View all photos" link, rendered over the strip. */
  children?: React.ReactNode;
}) {
  const scroller = useRef<HTMLDivElement | null>(null);
  /* Refs, not state: the frame loop reads these sixty times a second and a
     re-render per hover or per swipe would be pure waste. */
  const paused = useRef(false);
  /* When the glide may start again. Any interaction pushes it into the
     future; the frame loop does nothing until then. */
  const resumeAt = useRef(0);
  /* The last position the GLIDE wrote. Anything else on that property is
     somebody scrolling, which is how a user scroll is told apart from our own
     without listening for touch, wheel and pointer events separately. */
  const written = useRef(-1);

  const holdOff = useCallback(() => {
    resumeAt.current = performance.now() + IDLE_MS;
  }, []);

  /* One photograph plus the gap between two of them. Measured rather than
     assumed: the width is a clamp() of the viewport, so it is a different
     number on every screen and changes when the window is resized. */
  const step = useCallback(() => {
    const el = scroller.current;
    if (!el) return 0;
    const first = el.querySelector("img");
    const track = el.querySelector(".listing-gallery__track");
    if (!first || !track) return 0;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap || "0") || 0;
    return first.getBoundingClientRect().width + gap;
  }, []);

  /** Where the second copy of the photographs begins. */
  const loopWidth = useCallback(() => {
    const el = scroller.current;
    return el ? el.scrollWidth / 2 : 0;
  }, []);

  /*
   * Somebody scrolled, or the glide did. Told apart by comparing against the
   * value the glide last wrote: if the position is not where we put it, a
   * finger, a wheel or a trackpad moved it, and the glide holds off.
   */
  const onScroll = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    if (Math.abs(el.scrollLeft - written.current) > 2) holdOff();
  }, [holdOff]);

  const scrollByPhotos = useCallback(
    (direction: 1 | -1) => {
      const el = scroller.current;
      if (!el) return;
      const distance = step();
      if (distance <= 0) return;

      // The glide must not fight a 350ms smooth scroll it did not start.
      holdOff();

      const loop = loopWidth();
      let index = Math.round(el.scrollLeft / distance);

      /*
       * Going left from the first photograph.
       *
       * The strip is the same photographs twice, so there IS no first
       * photograph -- one copy along is the identical picture in the identical
       * place. Rather than disable the arrow (which is what used to happen,
       * and on a phone read as a missing control, because the glide leaves the
       * strip at zero until something moves it), jump silently to the same
       * spot one copy further along and scroll left from there. Nothing can be
       * seen to happen, because what is on screen does not change.
       */
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

      /*
       * Some browsers drop a smooth programmatic scroll on the floor -- it
       * returns without error and nothing moves. Measured in one: `auto`
       * scrolled, `smooth` did not, with no reduced-motion preference
       * reported. A control whose only job is to move must not depend on
       * that, so if nothing has happened shortly after, go there anyway.
       */
      window.setTimeout(() => {
        if (Math.abs(el.scrollLeft - from) < 1) el.scrollLeft = target;
        written.current = el.scrollLeft;
      }, 350);
    },
    [step, loopWidth, holdOff]
  );

  /*
   * The glide: one small nudge per frame, about seventy-five pixels a second,
   * which is one copy of the strip every eighty seconds -- the speed the CSS
   * animation ran at.
   */
  useEffect(() => {
    if (media.length < 2) return;
    // Somebody who has asked for less motion gets a strip that only moves when
    // they move it. The arrows still work; nothing is taken away.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let last = 0;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const el = scroller.current;
      const previous = last;
      last = now;
      if (!el || previous === 0) return;
      if (paused.current || document.hidden) return;
      // Somebody is scrolling, or just finished. Their momentum owns the
      // strip until it has been quiet for IDLE_MS.
      if (now < resumeAt.current) return;

      const loop = loopWidth();
      if (loop <= 0) return;
      // Capped: a tab returning from the background hands back an enormous
      // delta, which would fling the strip instead of resuming it.
      const elapsed = Math.min(now - previous, 100);
      let next = el.scrollLeft + (loop / (LOOP_SECONDS * 1000)) * elapsed;
      // The seam: one copy along is the same photograph in the same place, so
      // stepping back by exactly one copy cannot be seen.
      if (next >= loop) next -= loop;
      el.scrollLeft = next;
      written.current = el.scrollLeft;
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [media.length, loopWidth]);

  if (media.length === 0) return null;

  /* Twice, as the marquee did, so the loop has no seam. The second copy is
     hidden from assistive technology: it is the same photographs again. */
  const strip = [...media, ...media];

  return (
    <div
      className="listing-gallery"
      onPointerEnter={() => {
        paused.current = true;
      }}
      onPointerLeave={() => {
        paused.current = false;
      }}
      onFocusCapture={() => {
        paused.current = true;
      }}
      onBlurCapture={() => {
        paused.current = false;
      }}
      /* A finger has no hover, so touching the strip is what pausing it looks
         like on a phone. Both of these fire before any movement, so the first
         frame of a swipe is already the guest's. */
      onPointerDown={holdOff}
      onTouchStart={holdOff}
      onWheel={holdOff}
    >
      <div className="listing-gallery__scroller" ref={scroller} onScroll={onScroll}>
        <div className="listing-gallery__track">
          {strip.map((m, index) => (
            <img
              key={`${m.storage_path}-${index}`}
              src={mediaPublicUrl(m.storage_path)}
              alt={m.alt_text || title}
              loading={index === 0 ? undefined : "lazy"}
              aria-hidden={index >= media.length}
            />
          ))}
        </div>
      </div>

      {media.length > 1 && (
        <>
          <button
            type="button"
            className="listing-gallery__arrow listing-gallery__arrow--prev"
            onClick={() => scrollByPhotos(-1)}
            aria-label="Previous photo"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="listing-gallery__arrow listing-gallery__arrow--next"
            onClick={() => scrollByPhotos(1)}
            aria-label="Next photo"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </>
      )}

      {children}
    </div>
  );
}
