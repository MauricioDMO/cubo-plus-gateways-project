import { getRecentPosts } from "@/modules/content/server/content";
import { blogPostPath } from "@/modules/content/paths";

/*
 * A Google News sitemap.
 *
 * Worth being straight about what this does and does not do. Since 2019
 * Google News no longer requires a sitemap or a Publisher Center submission to
 * consider a site -- eligible sites are picked up automatically. What a news
 * sitemap still does is tell Google about an article within minutes of it
 * going up rather than whenever the next crawl happens.
 *
 * The spec is strict and the strictness is the point: only articles from the
 * last 48 HOURS may appear. A news sitemap listing a three-month-old guide is
 * an invalid one, and an invalid one is ignored -- so this filters by date
 * rather than listing everything and hoping.
 *
 * Note also that "news" means news. A guide to where to eat in El Zonte is
 * evergreen travel writing, not journalism, and it is unlikely to be surfaced
 * in the News tab however it is marked up. The surface that actually fits this
 * content is Discover, which is why max-image-preview:large in the root layout
 * matters more than this file does.
 */

export const dynamic = "force-dynamic";
/** Google re-reads a news sitemap constantly; a stale cached copy is worse than none. */
export const revalidate = 0;

const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://getawayselsalvador.com").replace(/\/+$/, "");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const base = siteUrl();
  const posts = await getRecentPosts(50);
  const cutoff = Date.now() - TWO_DAYS_MS;

  const entries = posts
    .filter((post) => {
      if (!post.published_at) return false;
      const at = new Date(post.published_at).getTime();
      return Number.isFinite(at) && at >= cutoff;
    })
    .map((post) => {
      const path = blogPostPath(post.published_at, post.slug);
      if (!path) return null;
      return `  <url>
    <loc>${escapeXml(`${base}${path}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>Getaways El Salvador</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(post.published_at).toISOString()}</news:publication_date>
      <news:title>${escapeXml(post.title)}</news:title>
    </news:news>
  </url>`;
    })
    .filter((entry): entry is string => entry !== null);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "no-store" },
  });
}
