"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import NavLink from "@/components/atoms/NavLink";
import { BurgerIcon, CloseIcon } from "@/components/atoms/icons";
import { NAV_ITEMS, type NavItem } from "@/modules/site/nav";

/*
 * The burger menu, below the live site's 1199.84px nav breakpoint (Task 27
 * follow-up). Replaces the earlier no-JS fallback, which left the whole nav
 * wrapped onto a second row with the Properties submenu permanently inlined --
 * functional, but nothing like the real site.
 *
 * Shape copied from the live theme's `.header-navbar__burger`: a bars button in
 * the header that opens a *full-screen fixed white overlay*
 * (`position: fixed; inset: 0; overflow-y: auto; padding: 1.5rem 2rem`) with the
 * menu stacked inside, top-level links at 1.125rem, submenu links indented 2rem,
 * and the current item marked by a 4px amber bar down its left edge.
 *
 * Two deliberate differences from the live overlay:
 *   - Submenu items (Villas, Apartments) are always visible rather than
 *     collapsed behind a tap on their parent. The live theme expands them with
 *     its own JS; here, showing them costs one line of vertical space and
 *     removes any chance of the two category pages being unreachable on touch.
 *   - There is a real close button. The live theme draws its dismiss X with a
 *     `::before` on the overlay, which is not focusable or announced.
 *
 * This is a client component, so it is deliberately the *only* interactive part
 * of the header along with NavLink: Header itself, and the whole footer, stay
 * server-rendered.
 */

/**
 * `items` comes from Header, which resolves the Properties submenu from the
 * live categories. It falls back to the static menu so this component still
 * renders something sane if it is ever mounted without them.
 */
export default function MobileNav({ items = NAV_ITEMS }: { items?: NavItem[] }) {
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // "Open" is stored as *the path the menu was opened on*, not a boolean, so a
  // completed navigation closes the overlay by itself: the moment usePathname
  // reports a different path, `open` is false. That covers link clicks, back and
  // forward, with no route-change effect (which the react-hooks
  // set-state-in-effect rule rightly rejects). Links inside still close it on
  // click as well, so the dismissal is immediate rather than waiting on the
  // route transition.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt !== null && openedAt === pathname;

  const close = () => setOpenedAt(null);

  // Escape closes, and focus goes back to the button that opened it.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenedAt(null);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // The overlay covers the viewport, so the page behind it must not scroll
  // under the finger. The previous inline value is restored rather than assumed
  // to be "" -- cheap insurance against fighting anything else that touches it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Move focus into the overlay when it opens so a keyboard user is not left
  // tabbing through the page behind it.
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  return (
    <div className="hidden max-[1199.981px]:block">
      <button
        ref={toggleRef}
        type="button"
        className="inline-flex items-center justify-center bg-transparent text-[rgba(7,_36,_86,_0.55)] cursor-pointer [transition:color_0.25s] p-2.5
          border-0 hover:text-[rgba(7,_36,_86,_0.75)]"
        aria-expanded={open}
        aria-label="Menu"
        onClick={() => setOpenedAt(open ? null : pathname)}
      >
        <BurgerIcon />
      </button>

      {open && (
        <div className="fixed inset-0 z-10000 overflow-x-hidden overflow-y-auto bg-background px-8 py-6 max-[767.981px]:p-6">
          <div className="flex justify-end mb-4">
            <button
              ref={closeRef}
              type="button"
              className="inline-flex items-center justify-center bg-transparent text-[rgba(7,_36,_86,_0.55)] cursor-pointer [transition:color_0.25s] p-2.5
                border-0 hover:text-[rgba(7,_36,_86,_0.75)]"
              aria-label="Close menu"
              onClick={close}
            >
              <CloseIcon />
            </button>
          </div>

          <nav aria-label="Primary">
            <ul className="list-none m-0 p-0">
              {/* The live "Sign In" item has been removed: the site no longer
                  has user accounts or auth. */}
              {items.map((item) => (
                <li key={item.href} className="relative p-0">
                  <NavLink href={item.href} className="flex items-center min-h-11 text-[18px] text-body-text [transition:color_0.25s] gap-2 not-aria-[current=page]:hover:text-accent
                    aria-[current=page]:text-button-bg aria-[current=page]:before:absolute aria-[current=page]:before:inset-y-0
                    aria-[current=page]:before:-left-8 aria-[current=page]:before:w-1 aria-[current=page]:before:rounded-r-full
                    aria-[current=page]:before:bg-accent max-[767.981px]:aria-[current=page]:before:-left-6" onNavigate={close}>
                    {item.label}
                  </NavLink>
                  {item.children && (
                    <ul className="list-none pr-0 pl-8 m-0 py-0">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <NavLink href={child.href} className="flex items-center min-h-11 text-body-text [transition:color_0.25s] gap-2 not-aria-[current=page]:hover:text-accent aria-[current=page]:text-button-bg" onNavigate={close}>
                            {child.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
