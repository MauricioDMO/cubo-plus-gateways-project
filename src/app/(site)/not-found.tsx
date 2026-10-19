import Link from "next/link";

export const metadata = { title: "Page not found — Getaways El Salvador" };

/*
 * notFound() is called from /listing/<slug>, /listing-category/<slug>,
 * /category/<slug> and /<...segments>. Without a not-found boundary inside the
 * (site) group, Next renders its built-in 404 against the root layout only --
 * no header, no footer, and none of the site's typography. This file puts the
 * 404 back inside the public chrome, reusing .site-main-content so it matches
 * the other one-off content pages.
 */
export default function NotFound() {
  return (
    <article className="max-w-180 pt-2 pb-8 mx-auto my-0 px-0 [&_h1]:text-[clamp(30px,_4.4vw,_40px)] [&_h1]:leading-[1.2] [&_h1]:mt-0 [&_h1]:mb-4
      [&_h1]:mx-0 [&_p]:text-[16px] [&_p]:leading-[30px] [&_ul]:list-none [&_ul]:pl-0 [&_ul]:mt-0 [&_ul]:mb-6 [&_ul]:overflow-hidden
      [&_ul]:mx-0 [&_ul]:rounded-[10px] [&_ul]:border [&_ul]:border-solid [&_ul]:border-border [&_ul_li]:text-heading
      [&_ul_li]:text-[15px] [&_ul_li]:leading-[22px] [&_ul_li]:px-4 [&_ul_li]:py-3 [&_ul_li:not(:last-child)]:border-b
      [&_ul_li:not(:last-child)]:border-solid [&_ul_li:not(:last-child)]:border-b-border">
      <h1>Page not found</h1>
      <p>
        We couldn&apos;t find that page. The listing may have been unpublished, or the link may be out of
        date.
      </p>
      <p>
        <Link className="btn-cta inline-flex items-center justify-center bg-button-bg text-button-text font-body font-medium text-[16px] no-underline
          whitespace-nowrap px-7 py-2.25 rounded-full [.home-hero\_\_actions_&]:max-[768.001px]:grow
          [.home-hero\_\_actions_&]:max-[768.001px]:shrink [.home-hero\_\_actions_&]:max-[768.001px]:basis-[auto]
          [.home-hero\_\_actions_&]:max-[768.001px]:min-h-11.5 [.home-hero\_\_actions_&]:max-[768.001px]:whitespace-nowrap
          [.home-hero\_\_actions_&]:max-[768.001px]:px-4 [.cta-column_&]:self-center [.cta-column_&]:w-full [.cta-column_&]:max-w-80
          [.cta-column_&]:bg-[rgb(250,_251,_249)] [.cta-column_&]:text-button-bg [.cta-column_&]:px-7 [.cta-column_&]:py-3
          [.cta-column_&]:border-0 [.cta-column+.cta-column_&]:bg-button-bg [.cta-column+.cta-column_&]:text-button-text" href="/">
          Back to home
        </Link>
      </p>
    </article>
  );
}
