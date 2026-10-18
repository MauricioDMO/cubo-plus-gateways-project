import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { descriptionFromHtml, getMediaByIds, getPageBySlug, getPostBySlugAndDate } from "@/lib/content";
import { mediaPublicUrl } from "@/lib/media";
import { sanitizeContentHtml } from "@/lib/sanitize-html";
import ContactDetails from "@/components/ContactDetails";
import JsonLd from "@/components/JsonLd";
import { articleSchema, breadcrumbSchema, contactPageSchema } from "@/lib/structured-data";

/** The featured image's storage path, or null when the post has none. */
async function postCoverPath(featuredMediaId: number | null): Promise<string | null> {
  if (featuredMediaId == null) return null;
  const [media] = await getMediaByIds([featuredMediaId]);
  return media?.storage_path ?? null;
}

async function postCoverUrl(featuredMediaId: number | null): Promise<string | null> {
  const path = await postCoverPath(featuredMediaId);
  return path ? mediaPublicUrl(path) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ segments: string[] }>;
}): Promise<Metadata> {
  const { segments } = await params;

  if (segments.length === 1) {
    const page = await getPageBySlug(segments[0]);
    if (!page) return { title: "Not Found" };
    return {
      title: page.seo_title || page.title,
      description:
        page.seo_description ||
        descriptionFromHtml(page.content_html) ||
        "Oceanfront vacation rentals in El Zonte, La Libertad.",
      alternates: { canonical: `/${segments[0]}` },
    };
  }

  if (segments.length === 4) {
    const [year, month, day, slug] = segments;
    const post = await getPostBySlugAndDate(year, month, day, slug);
    if (!post) return { title: "Not Found" };
    const cover = await postCoverUrl(post.featured_media_id);
    return {
      title: post.seo_title || post.title || "Getaways El Salvador",
      // The excerpt is the editor's own one-line summary of the post. It was
      // being written by the admin form and read by nothing, so a summary an
      // editor took the trouble to write appeared nowhere; it is a far better
      // meta description than the generic site blurb.
      // Falls back to the post's own opening prose before the site blurb:
      // all nine posts had neither a description nor an excerpt, so all nine
      // were describing themselves identically.
      description:
        post.seo_description ||
        post.excerpt ||
        descriptionFromHtml(post.content_html) ||
        "Guides and stories from the coast of El Salvador.",
      alternates: { canonical: `/${segments.join("/")}` },
      // The post's OWN photograph. Without this every post fell back to the
      // layout's site-wide hero, so a piece about one restaurant in El Zonte
      // shared as a drone shot of the coast -- and Google Discover, which is
      // a photograph with a headline on it, had nothing specific to show.
      openGraph: {
        type: "article",
        title: post.seo_title || post.title,
        url: `/${segments.join("/")}`,
        ...(post.published_at ? { publishedTime: post.published_at } : {}),
        ...(cover ? { images: [{ url: cover, alt: post.title }] } : {}),
      },
    };
  }

  return { title: "Not Found" };
}

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ segments: string[] }>;
}) {
  const { segments } = await params;

  if (segments.length === 1) {
    const page = await getPageBySlug(segments[0]);
    if (!page) notFound();
    const isContact = page.slug === "contact-us";
    return (
      <article>
        <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: page.title, path: `/${page.slug}` }])} />
        {/* The contact page is where Google most expects a local business to
            state plainly where it is, and where it reconciles a site against a
            Business Profile. This one said only "Email: ..." in a paragraph. */}
        {isContact && <JsonLd data={contactPageSchema()} />}

        <h1>{page.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: sanitizeContentHtml(page.content_html) }} />
        {isContact && <ContactDetails />}
      </article>
    );
  }

  if (segments.length === 4) {
    const [year, month, day, slug] = segments;
    const post = await getPostBySlugAndDate(year, month, day, slug);
    if (!post) notFound();
    const path = `/${segments.join("/")}`;
    const coverPath = await postCoverPath(post.featured_media_id);
    return (
      <article>
        <JsonLd
          data={articleSchema({
            title: post.title,
            slug: post.slug,
            path,
            published_at: post.published_at ?? null,
            updated_at: post.updated_at ?? null,
            description: post.seo_description || post.excerpt || descriptionFromHtml(post.content_html),
            // articleSchema has always accepted an image and never been given
            // one, so every BlogPosting shipped without it. Discover reads it.
            imagePath: coverPath,
          })}
        />
        <JsonLd
          data={breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Journal", path: "/blog" },
            { name: post.title, path },
          ])}
        />

        <h1>{post.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: sanitizeContentHtml(post.content_html) }} />
      </article>
    );
  }

  notFound();
}
