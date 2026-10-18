"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/*
 * A nav link that knows whether it points at the page you are on (Task 27
 * follow-up). The live theme marks the current item with WordPress's
 * `current-menu-item` class and draws an amber cue on it -- a 3px bar across
 * the top in the desktop nav, a 4px bar down the left side in the burger
 * overlay. Reproducing that needs the current path, which is only available on
 * the client, so this is the one interactive shard the otherwise
 * server-rendered Header pulls in (alongside MobileNav). The <li>/<ul>
 * structure, the CSS dropdown, and the whole footer stay server-rendered.
 *
 * `is-active` carries the visual; `aria-current="page"` carries the same fact
 * to assistive tech. Both cues are placed on the <a>, and the CSS positions the
 * bar against the parent <li> (which is `position: relative`).
 */

export default function NavLink({
  href,
  className,
  children,
  onNavigate,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  /** Lets the burger overlay close itself when a link inside it is clicked. */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  // "/" must match exactly -- as a prefix it would mark Home active on every
  // page. Everything else also matches its descendants so that, say,
  // /properties stays marked while a nested route under it is open. Blog posts
  // live at /YYYY/MM/DD/slug rather than under /blog, so they correctly do not
  // mark Blog active (the live site behaves the same way).
  const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={[className, isActive ? "is-active" : null].filter(Boolean).join(" ") || undefined}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
    >
      {children}
    </Link>
  );
}
