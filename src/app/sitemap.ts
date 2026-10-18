import type { MetadataRoute } from "next";

import { getAllListings, getListingCategoriesWithCounts, getRecentPosts, visibleListingCategories } from "@/lib/content";
import { collectDestinations } from "@/lib/locations";
import { blogPostPath } from "@/lib/paths";

/*
 * The site served no sitemap at all -- /sitemap.xml was a 404 -- so every URL
 * had to be found by crawling. Built from the database rather than a hand-kept
 * list, which is the only version that stays true.
 *
 * Admin, checkout and the stand-in bank page are absent on purpose: they are
 * either gated, per-session, or a rehearsal, and none of them is a page a
 * search result should ever land on.
 */

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://getawayselsalvador.com").replace(/\/+$/, "");
}

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const [listings, categories, posts] = await Promise.all([
    getAllListings(),
    getListingCategoriesWithCounts(),
    getRecentPosts(100),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/properties`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/concierge`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact-us`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];

  // Destination pages rank for the searches that convert ("vacation rental in
  // El Zonte"), so they sit just under /properties rather than with the tail.
  const destinations: MetadataRoute.Sitemap = collectDestinations(listings).map((destination) => ({
    url: `${base}/destinations/${destination.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const listingPages: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `${base}/listing/${listing.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Empty categories are 404s now (see listing-category/[slug]), so listing
  // one here would be submitting a dead URL to Google.
  const categoryPages: MetadataRoute.Sitemap = visibleListingCategories(categories).map((category) => ({
    url: `${base}/listing-category/${category.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const postPages: MetadataRoute.Sitemap = posts
    .map((post) => {
      const path = blogPostPath(post.published_at, post.slug);
      return path
        ? {
            url: `${base}${path}`,
            lastModified: post.published_at ? new Date(post.published_at) : now,
            changeFrequency: "monthly" as const,
            priority: 0.5,
          }
        : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return [...staticPages, ...destinations, ...listingPages, ...categoryPages, ...postPages];
}
