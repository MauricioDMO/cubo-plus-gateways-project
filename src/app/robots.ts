import type { MetadataRoute } from "next";

/*
 * There was no robots.txt -- /robots.txt was a 404 -- so nothing pointed a
 * crawler at the sitemap, and nothing kept it out of the places it should not
 * be.
 *
 * The disallows are not a security measure. They keep crawlers out of the
 * booking API and the post-booking receipt.
 * They are here so that per-session checkout URLs and an operator dashboard do
 * not end up as indexed pages competing with real ones.
 */

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://getawayselsalvador.com").replace(/\/+$/, "");
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/booking-confirmation"],
    },
    sitemap: [`${siteUrl()}/sitemap.xml`, `${siteUrl()}/news-sitemap.xml`],
  };
}
