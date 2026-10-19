"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { mediaPublicUrl } from "@/shared/media/media";

/*
 * One room of the photo tour: its photographs side by side, and the viewer
 * that opens when one is pressed.
 *
 * Only this part of the tour is a client component. The headings, the lead
 * line and the room navigation stay server-rendered in PhotoTour.tsx, because
 * none of them has any reason to hydrate. The photographs do: each is a link
 * to its own full-size file, which works with no JavaScript at all, and which
 * this upgrades into the viewer once there is one to open.
 *
 * The viewer is scoped to ONE room, which is a decision the data makes for
 * us. Every listing carries ten tagged photographs across six to eight rooms,
 * so a room holds one, two or three -- most often one. A viewer that walked
 * the whole tour would be a different feature; arrows that walk three
 * photographs are the one that was asked for.
 *
 * Which is also why a room of one photograph shows no arrows at all. A
 * disabled pair of arrows on half the rooms is exactly the dead control this
 * design was chosen to avoid.
 */

type TourMedia = { id: number; storage_path: string; alt_text: string | null; width?: number; height?: number };

/*
 * Focusable things inside the dialog, for the trap.
 *
 * `:not([disabled])` is the whole point of writing this out. The previous
 * version of this viewer queried plain "button, [href], select, input", so at
 * the first photograph the disabled Previous arrow was focusable[0] -- an
 * element that cannot take focus. `activeElement === first` was therefore
 * never true, and Shift+Tab walked straight out of the dialog into a page the
 * guest cannot see.
 */
const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export default function PhotoTourRoom({
  label,
  media,
  title,
}: {
  label: string;
  media: TourMedia[];
  /** The property's name, for alt text on a photograph that has none. */
  title: string;
}) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const dialog = useRef<HTMLDivElement | null>(null);
  const strip = useRef<HTMLDivElement | null>(null);
  /* The row of photographs on the page -- not the one inside the viewer.
     On a phone it is a one-line carousel; on a wider screen the same element
     is a grid and these arrows are hidden by CSS. */
  const row = useRef<HTMLDivElement | null>(null);
  /* The button that opened the viewer, so focus can go back to the exact
     photograph the guest was looking at rather than to the top of the page. */
  const opener = useRef<HTMLAnchorElement | null>(null);

  const open = openAt !== null;
  const many = media.length > 1;

  const close = useCallback(() => {
    setOpenAt(null);
    opener.current?.focus();
  }, []);

  /** Scrolls the strip to a photograph, and remembers which one that is. */
  const goTo = useCallback((index: number) => {
    const el = strip.current;
    if (!el) return;
    const bounded = Math.max(0, Math.min(index, el.children.length - 1));
    const target = bounded * el.clientWidth;
    const from = el.scrollLeft;
    setOpenAt(bounded);
    if (Math.abs(target - from) < 1) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: target, behavior: reduced ? "auto" : "smooth" });
    /* Some browsers drop a smooth programmatic scroll on the floor: it
       returns without error and nothing moves. Measured in one, so the same
       fallback ListingGallery uses applies here. */
    window.setTimeout(() => {
      if (Math.abs(el.scrollLeft - from) < 1) el.scrollLeft = target;
    }, 350);
  }, []);

  /* The strip is one photograph wide, so where it sits IS which photograph is
     on screen -- including after a swipe, which nothing else would tell us
     about. */
  const readIndex = useCallback(() => {
    const el = strip.current;
    if (!el || el.clientWidth === 0) return;
    setOpenAt(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  // Opening: put the strip on the photograph that was pressed, and move focus
  // into the dialog so the keyboard is inside it.
  useEffect(() => {
    if (!open) return;
    const el = strip.current;
    if (el) el.scrollLeft = openAt * el.clientWidth;
    dialog.current?.querySelector<HTMLElement>("button")?.focus();
    // openAt is deliberately absent: this runs when the viewer opens, not
    // every time the guest moves within it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "ArrowRight" && many) goTo(openAt + 1);
      if (event.key === "ArrowLeft" && many) goTo(openAt - 1);
      if (event.key !== "Tab") return;

      // The trap. Without it, Tab walks out of the dialog and into a page the
      // guest cannot see.
      const focusable = Array.from(dialog.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, openAt, many, close, goTo]);

  // The page behind must not scroll under the viewer. Same as MobileNav.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /**
   * One photograph along the room's row.
   *
   * The step is measured, not assumed: the card is a percentage of the
   * viewport, so it is a different number on every screen. And the hard-set
   * fallback is here for the same reason it is in the gallery -- a smooth
   * programmatic scroll is silently dropped in some browsers, and a control
   * whose only job is to move must not depend on it.
   */
  const scrollRow = useCallback((direction: 1 | -1) => {
    const el = row.current;
    if (!el) return;
    const figure = el.querySelector(".photo-tour__figure");
    if (!figure) return;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap || "0") || 0;
    const distance = figure.getBoundingClientRect().width + gap;
    if (distance <= 0) return;

    const index = Math.round(el.scrollLeft / distance);
    const target = Math.max(0, Math.min((index + direction) * distance, el.scrollWidth - el.clientWidth));
    const from = el.scrollLeft;
    if (Math.abs(target - from) < 1) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: target, behavior: reduced ? "auto" : "smooth" });
    window.setTimeout(() => {
      if (Math.abs(el.scrollLeft - from) < 1) el.scrollLeft = target;
    }, 350);
  }, []);

  const altFor = (item: TourMedia) => item.alt_text || `${title}, ${label}`;

  return (
    <>
      <div className="relative">
        {/* Arrows for the phone, where the row below is a one-line carousel.
            Hidden by CSS on a wider screen, where the same element is a grid
            and every photograph is already visible -- an arrow with nowhere
            to go is the dead control this tour was designed to avoid. A room
            of one photograph gets none at either width. */}
        {media.length > 1 && (
          <>
            <button
              type="button"
              className="hidden max-[560.001px]:grid absolute top-[28%] left-1.5 z-2 place-items-center size-9 bg-white/94
                text-heading shadow-[0_4px_14px_rgba(7,_36,_86,_0.16)] cursor-pointer p-0 rounded-full border border-border
                focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
              onClick={() => scrollRow(-1)}
              aria-label={`Previous photo of ${label}`}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="hidden max-[560.001px]:grid absolute top-[28%] right-1.5 z-2 place-items-center size-9 bg-white/94
                text-heading shadow-[0_4px_14px_rgba(7,_36,_86,_0.16)] cursor-pointer p-0 rounded-full border border-border
                focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
              onClick={() => scrollRow(1)}
              aria-label={`Next photo of ${label}`}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </>
        )}
      <div className="grid grid-cols-[repeat(auto-fit,_minmax(min(100%,_260px),_1fr))] items-start gap-[clamp(16px,_2.4vw,_26px)] max-[560.001px]:flex
        max-[560.001px]:overflow-x-auto max-[560.001px]:snap-x max-[560.001px]:[scrollbar-width:none]
        max-[560.001px]:pb-0.5 max-[560.001px]:gap-3
        [&::-webkit-scrollbar]:max-[560.001px]:hidden" ref={row}>
        {media.map((item, index) => (
          <figure key={item.id} className="photo-tour__figure w-full m-0 max-[560.001px]:flex-none max-[560.001px]:basis-[82%]
            max-[560.001px]:snap-start">
            {/*
             * An anchor to the photograph itself, not a button.
             *
             * Before this island hydrates -- and for anyone whose JavaScript
             * never arrives -- pressing it still opens the full-size image,
             * and middle-click and "open in new tab" behave the way every
             * other picture on the web does. preventDefault upgrades it to
             * the viewer once there is a viewer to open. Nothing on the page
             * is ever a control that does nothing.
             */}
            <a
              className="group block w-full overflow-hidden bg-transparent cursor-zoom-in p-0 rounded-[10px] border-0
                focus-visible:outline-2 focus-visible:outline-heading focus-visible:outline-offset-3"
              href={mediaPublicUrl(item.storage_path)}
              aria-haspopup="dialog"
              aria-label={`View larger: ${altFor(item)}`}
              onClick={(event) => {
                event.preventDefault();
                opener.current = event.currentTarget;
                setOpenAt(index);
              }}
            >
              <Image
                className={`block w-full h-auto transition-transform duration-300 ease-[ease] rounded-[10px] group-hover:scale-[1.03] ${many ? "aspect-4/3 object-cover" : ""}`}
                src={mediaPublicUrl(item.storage_path)}
                width={item.width ?? 1200}
                height={item.height ?? 800}
                sizes="(max-width: 960px) 100vw, 900px"
                alt={altFor(item)}
                loading="lazy"
              />
            </a>
            {item.alt_text && <figcaption className="mt-2 text-[14px] text-body-text">{item.alt_text}</figcaption>}
          </figure>
        ))}
      </div>
      </div>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          /*
           * Portalled to <body>, and not optionally: `position: fixed`
           * resolves against a transformed ancestor, and an earlier version
           * of this viewer rendered as a band inside the gallery strip
           * because .listing-gallery sets transform: translateX(-50%).
           */
          <div
            className="fixed inset-0 z-[9000] grid grid-rows-[auto_1fr] bg-[rgba(7,_16,_30,_0.94)]"
            role="dialog"
            aria-modal="true"
            aria-label={`${label} — photographs of ${title}`}
            ref={dialog}
            onClick={(event) => {
              // The backdrop closes; the photograph does not.
              if (event.target === event.currentTarget) close();
            }}
          >
            <div className="flex items-center justify-between text-white px-[clamp(14px,_3vw,_28px)] py-3.5 gap-4
              max-[560.001px]:pt-[calc(14px_+_env(safe-area-inset-top,_0px))]">
              <p className="flex items-baseline font-heading text-[16px] m-0 gap-2.5">
                {label}
                {many && (
                  <span className="text-[13px] text-white/66 tabular-nums" aria-live="polite">
                    {openAt + 1} of {media.length}
                  </span>
                )}
              </p>
              <button type="button" className="grid place-items-center size-11 bg-white/14 text-white cursor-pointer p-0 rounded-full border-0
                hover:bg-white/24" onClick={close} aria-label="Close">
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {/* A scroll-snap strip rather than one swapped <img>: swiping is
                then the browser's job and there is no touch handling here to
                get wrong. */}
            <div className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" ref={strip} onScroll={readIndex}>
              {media.map((item, index) => (
                <div key={item.id} className="flex-none basis-full grid place-items-center pt-0 pb-[clamp(20px,_4vw,_40px)] snap-start px-[clamp(14px,_6vw,_76px)]
                  max-[560.001px]:pb-[calc(20px_+_env(safe-area-inset-bottom,_0px))]">
                  <Image
                    src={mediaPublicUrl(item.storage_path)}
                    alt={altFor(item)}
                    width={item.width ?? 1200}
                    height={item.height ?? 800}
                    sizes="100vw"
                    loading={openAt === index ? "eager" : "lazy"}
                    className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
              ))}
            </div>

            {many && (
              <>
                <button
                  type="button"
                  className="absolute top-1/2 -translate-y-1/2 grid place-items-center size-12 bg-white/16 text-white
                    cursor-pointer [transition:background-color_0.15s_ease,_opacity_0.15s_ease] p-0 rounded-full border-0
                    enabled:hover:bg-white/30 disabled:opacity-30 disabled:cursor-default max-[560.001px]:size-10
                    left-[clamp(8px,_2vw,_20px)] max-[560.001px]:left-1"
                  onClick={() => goTo(openAt - 1)}
                  disabled={openAt === 0}
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={22} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="absolute top-1/2 -translate-y-1/2 grid place-items-center size-12 bg-white/16 text-white
                    cursor-pointer [transition:background-color_0.15s_ease,_opacity_0.15s_ease] p-0 rounded-full border-0
                    enabled:hover:bg-white/30 disabled:opacity-30 disabled:cursor-default max-[560.001px]:size-10
                    right-[clamp(8px,_2vw,_20px)] max-[560.001px]:right-1"
                  onClick={() => goTo(openAt + 1)}
                  disabled={openAt === media.length - 1}
                  aria-label="Next photo"
                >
                  <ChevronRight size={22} aria-hidden="true" />
                </button>
              </>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
