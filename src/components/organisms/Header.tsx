import Link from "next/link";
import Image from "next/image";
import { mediaPublicUrl } from "@/shared/media/media";
import MobileNav from "@/components/organisms/MobileNav";
import NavLink from "@/components/atoms/NavLink";
import { PlusIcon } from "@/components/atoms/icons";
import { navItemsWithCategories, SUBMIT_LISTING_HREF } from "@/modules/site/nav";
import { getListingCategoriesWithCounts } from "@/modules/listings/server/listings";
import { visibleListingCategories } from "@/modules/listings/categories";
import { siteText } from "@/modules/site/server/site-text";

/*
 * Site header (Task 27) -- a structural match for the live site's
 * `header.site-header > .header-navbar`, verified against the real DOM, the
 * real stylesheet, and devtools measurements taken at a 1280px viewport:
 *
 *   .header-navbar__start   logo <a class="custom-logo-link"> -> "/"   (279x59)
 *   .header-navbar__middle  nav: Home / About Us / Properties (+ Villas,
 *                           Apartments submenu) / Blog / Contact Us / Sign In
 *   .header-navbar__end     burger button (below 1199.84px) +
 *                           <button class="button button--primary">
 *                           "List a Property"                          (167x42)
 *
 * Like the live navbar, this is full-bleed with 2rem side padding rather than
 * sitting in the 1120px content container: the desktop nav needs ~1113px of
 * room, which the container's 1072px content box cannot give it at any viewport
 * width.
 *
 * The live nav renders "Sign In" twice -- HivePress emits a `menu-item--first`
 * copy for the burger and a `menu-item--last` copy for desktop, and hides one of
 * them per breakpoint. Both positions are reproduced: last in the desktop nav
 * here, first in the overlay in MobileNav.
 *
 * Stays a server component. Only the two interactive shards are client
 * components: NavLink (needs usePathname for the active-item cue) and MobileNav
 * (burger toggle state).
 */

// The live custom-logo is WordPress attachment 488,
// 2026/02/cropped-logo-gw-web.png (1340x281, the "GETAWAYS" palm-tree
// wordmark), which was migrated into Storage as media row 55. NOT
// 2021/09/logo.png (wp_id 23) -- that one also lives in the bucket but it is
// the RentalHive *theme demo* logo left over from the 2021 install, and the
// live site does not reference it anywhere.
const LOGO_STORAGE_PATH = "2026/02/cropped-logo-gw-web.png";
const LOGO_INTRINSIC_WIDTH = 1340;
const LOGO_INTRINSIC_HEIGHT = 281;

export default async function Header() {
  // Reads the live categories so the Properties submenu cannot outlive them --
  // see navItemsWithCategories in ./nav.
  const [categories, c] = await Promise.all([getListingCategoriesWithCounts(), siteText()]);
  const navItems = navItemsWithCategories(visibleListingCategories(categories));

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__logo" aria-label="Getaways El Salvador — Home">
          <Image
            src={mediaPublicUrl(LOGO_STORAGE_PATH)}
            alt="Getaways El Salvador"
            width={LOGO_INTRINSIC_WIDTH}
            height={LOGO_INTRINSIC_HEIGHT}
            sizes="279px"
            loading="eager"
          />
        </Link>

        {/* Hidden below 1199.84px, where MobileNav's burger takes over -- the
            live breakpoint, `max-width: 74.99em` in the RentalHive stylesheet. */}
        <nav className="site-nav" aria-label="Primary">
          <ul className="site-nav__list">
            {navItems.map((item) => (
              <li key={item.href} className={item.children ? "site-nav__item--has-children" : undefined}>
                <NavLink href={item.href}>{item.label}</NavLink>
                {/* Hover/focus dropdown, matching the live menu item's own
                    `menu-item-has-children` + `ul.sub-menu` pair. CSS-only: see
                    .site-nav__submenu in globals.css. */}
                {item.children && (
                  <ul className="site-nav__submenu">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <NavLink href={child.href}>{child.label}</NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            {/* The live "Sign In" item has been removed: the site no longer has
                user accounts or auth, so the header matches the public nav. */}
          </ul>
        </nav>

        <div className="site-header__actions">
          <MobileNav items={navItems} />
          {/* Live markup is a <button data-url="/submit-listing/">, i.e. a
              link wearing a button, for HivePress's submit-a-listing flow.
              Rendered as a real link here for the same reason the homepage's
              "List a Property" CTA does (see app/page.tsx): there is no
              submit-listing flow in a read-only migration, and a dead <button>
              would look present but do nothing. Geometry comes from .btn-cta,
              which already matches the live pill exactly (#394342, 9999px
              radius, 9px/28px padding, 16px/500 label). */}
          <Link
            href={c.text("header.cta.href") || SUBMIT_LISTING_HREF}
            {...c.edit("header.cta.label", "Menu button", "link", {
              hrefSlot: "header.cta.href",
              className: "btn-cta site-header__submit",
            })}
          >
            <PlusIcon />
            <span className="site-header__submit-label">{c.text("header.cta.label")}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
