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
    <header className="border-b border-solid border-b-border bg-background">
      <div className="flex items-center justify-between px-8 py-4 gap-6 max-[767.981px]:px-5 max-[767.981px]:py-3.5">
        <Link href="/" className="block min-w-0 leading-[0] [&_img]:block [&_img]:w-69.75 [&_img]:max-w-full [&_img]:h-auto
          [&_img]:max-[767.981px]:w-[clamp(150px,_50vw,_220px)]" aria-label="Getaways El Salvador — Home">
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
        <nav className="flex self-stretch items-stretch mx-0 my-[-16px] max-[1199.981px]:hidden" aria-label="Primary">
          <ul className="site-nav__list flex items-stretch list-none m-0 p-0 [&>li]:relative [&>li]:flex [&>li]:items-center [&>li]:px-4 [&>li]:py-0
            [&_a]:text-body-text [&_a]:text-[16px] [&_a]:whitespace-nowrap [&_a]:[transition:color_0.25s] [&_a:hover]:text-accent">
            {navItems.map((item) => (
              <li key={item.href} className={item.children ? `site-nav__item--has-children [&>a::after]:content-[''] [&>a::after]:inline-block [&>a::after]:[vertical-align:middle]
                [&>a::after]:ml-2 [&>a::after]:border-l-[4px] [&>a::after]:border-solid [&>a::after]:border-l-[transparent]
                [&>a::after]:border-r-[4px] [&>a::after]:border-r-[transparent] [&>a::after]:border-t-[5px]
                [&>a::after]:border-t-[currentColor] [&>a::after]:opacity-40` : undefined}>
                <NavLink href={item.href}>{item.label}</NavLink>
                {/* Hover/focus dropdown, matching the live menu item's own
                    `menu-item-has-children` + `ul.sub-menu` pair. CSS-only: see
                    the submenu's hover/focus-within Tailwind variants. */}
                {item.children && (
                  <ul className="site-nav__submenu hidden absolute z-[1000] top-[100%] left-0 min-w-[14rem] list-none bg-background
                    shadow-[0_2px_4px_0_rgba(7,_36,_86,_0.075)] m-0 px-0 py-4 border border-solid border-border
                    [.site-nav\_\_item--has-children:hover>&]:block [.site-nav\_\_item--has-children:focus-within>&]:block [&_li]:px-6 [&_li]:py-1">
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

        <div className="flex items-center shrink-0 max-[1199.981px]:gap-6">
          <MobileNav items={navItems} />
          {/* Live markup is a <button data-url="/submit-listing/">, i.e. a
              link wearing a button, for HivePress's submit-a-listing flow.
              Rendered as a real link here for the same reason the homepage's
              "List a Property" CTA does (see app/page.tsx): there is no
              submit-listing flow in a read-only migration, and a dead <button>
               would look present but do nothing. The utilities keep the live
               pill's geometry: 9px/28px padding and a 16px/500 label. */}
          <Link
            href={c.text("header.cta.href") || SUBMIT_LISTING_HREF}
            {...c.edit("header.cta.label", "Menu button", "link", {
              hrefSlot: "header.cta.href",
              className: "inline-flex items-center justify-center gap-2 rounded-full bg-button-bg px-7 py-2.25 font-body text-[16px] font-medium whitespace-nowrap text-button-text no-underline max-[767.981px]:gap-0 max-[767.981px]:p-3.5",
            })}
          >
            <PlusIcon className="hidden size-4 shrink-0 max-[767.981px]:block" />
            <span className="max-[767.981px]:hidden">{c.text("header.cta.label")}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
