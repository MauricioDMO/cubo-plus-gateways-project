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
    <article className="max-w-180 pt-2 pb-8 mx-auto my-0 px-0">
      <h1 className="text-[clamp(30px,_4.4vw,_40px)] leading-[1.2] mt-0 mb-4 mx-0">Page not found</h1>
      <p>
        We couldn&apos;t find that page. The listing may have been unpublished, or the link may be out of
        date.
      </p>
      <p>
        <Link className="inline-flex items-center justify-center bg-button-bg text-button-text font-body font-medium text-[16px] no-underline
          whitespace-nowrap px-7 py-2.25 rounded-full" href="/">
          Back to home
        </Link>
      </p>
    </article>
  );
}
