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
    <article className="site-main-content">
      <h1>Page not found</h1>
      <p>
        We couldn&apos;t find that page. The listing may have been unpublished, or the link may be out of
        date.
      </p>
      <p>
        <Link className="btn-cta" href="/">
          Back to home
        </Link>
      </p>
    </article>
  );
}
