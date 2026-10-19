import Link from "next/link";
import Image from "next/image";
import { mediaPublicUrl } from "@/shared/media/media";
import { blogPostPath } from "@/modules/content/paths";
import { formatPublishedDate } from "@/shared/utils/time";

/*
 * Shared blog post card (Task 30) -- used by the homepage's "From the Blog"
 * teasers, /blog, and /category/<slug>. Confirmed via devtools on
 * getawayselsalvador.com that all three sections render the exact same
 * `.post--archive` card partial, so one component now backs all three
 * instead of the two near-duplicate <article> blocks that used to live in
 * app/page.tsx and app/blog/page.tsx (copy-pasted again for
 * app/category/[slug]/page.tsx).
 *
 * Card shape, verified live (see the stylesheet rules pulled via
 * getComputedStyle/cssRules on the real site):
 *   - The category badge is a pill *overlaid* on the photo, bottom-left --
 *     `.post--archive.has-post-thumbnail .post__categories { position:
 *     absolute; left: 1.5rem; bottom: 1rem; margin-bottom: 10px; }`. An
 *     earlier task's notes assumed top-left from a screenshot; the live
 *     stylesheet says bottom-left, so that's what this renders.
 *   - A dark-to-transparent gradient scrim sits under the photo
 *     (`.post--archive .post__image a::after`) so the white pill stays
 *     legible over any photo.
 *   - No excerpt: the real card is photo -> title -> meta line, full stop.
 *     (A previous /blog-only card showed post.excerpt; dropped here for
 *     exact parity now that all three cards share this component.)
 *   - Meta line reads "AUGUST 10, 2026 • BY GETAWAYSELSALVADOR • NO
 *     COMMENTS" on the real site (dot-separated via a generated ::after
 *     pseudo-element, all-caps via text-transform). Rendered here with a
 *     plain " • " text separator instead of replicating the generated dot.
 */

// The migration never extracted wp_users, so posts only carry the numeric
// author_wp_id, not a display name -- and every post in extract/output/posts.json
// shares the same author_wp_id (271705264), the site's single author account.
// The real site's byline reads "BY GETAWAYSELSALVADOR" (its one WP username,
// rendered as one no-space word -- confirmed via devtools, not a prettified
// "Getaways El Salvador"), so this is hardcoded verbatim as that lowercase
// username and left to the existing text-transform: uppercase on
// .post-card__meta to capitalize it exactly the way the real site does. A
// disclosed simplification for a value that's constant across the dataset,
// not a stand-in for real per-author resolution (which would need a new
// extraction pass) -- but the string itself matches the live site exactly.
const AUTHOR_DISPLAY_NAME = "getawayselsalvador";

export type PostCardPost = {
  id: number;
  slug: string;
  title: string;
  published_at: string;
  featured_media: { storage_path: string; alt_text: string | null } | null;
  categories: Array<{ id: number; name: string; slug: string }>;
};

export default function PostCard({ post }: { post: PostCardPost }) {
  const href = blogPostPath(post.published_at, post.slug);
  const category = post.categories[0];

  return (
    <article className="flex flex-col items-start shadow-[0_5px_30px_rgba(7,_36,_86,_0.075)] overflow-hidden p-5 rounded-[10px]">
      {post.featured_media ? (
        <div className="relative block w-[calc(100%_+_40px)] -mt-5 mb-4 -mx-5">
          <Link href={href} className="block relative after:absolute after:inset-0 after:bg-[linear-gradient(to_top,_rgba(15,_23,_39,_0.75)_0%,_rgba(15,_23,_39,_0)_45%)]">
            <Image
              className="block w-full h-45 object-cover"
              src={mediaPublicUrl(post.featured_media.storage_path)}
              width={640}
              height={360}
              sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw"
              alt={post.featured_media.alt_text || post.title}
              loading="lazy"
            />
          </Link>
          {category && (
            <Link href={`/category/${category.slug}`} className="absolute left-6 bottom-6.5 z-1 inline-block bg-white/35 text-white text-[11px] leading-[16.5px] uppercase tracking-[1px] px-3 py-1.5 rounded-full">
              {category.name}
            </Link>
          )}
        </div>
      ) : (
        // No real post in the migrated dataset is missing a featured photo,
        // but if one ever were, the badge still needs somewhere to render --
        // the badge stays in the normal flow without a photograph.
        category && (
          <Link
            href={`/category/${category.slug}`}
            className="inline-block bg-button-bg text-button-text text-[11px] leading-[16.5px] uppercase tracking-[1px] px-3 py-1.5 rounded-full mt-0 mb-2 mx-0 border-transparent"
          >
            {category.name}
          </Link>
        )
      )}
      <h3 className="text-[21px] leading-[26.25px] mt-3 mb-0 mx-0">
        <Link href={href} className="text-heading">{post.title}</Link>
      </h3>
      <p className="w-full text-[11px] font-normal leading-[16.5px] text-muted-text uppercase tracking-[1px] mt-4 mb-0 pt-5 border-t-[0.8px]
        border-solid border-t-[rgba(7,_36,_86,_0.075)] mx-0">
        {formatPublishedDate(post.published_at)} • By {AUTHOR_DISPLAY_NAME} • No comments
      </p>
    </article>
  );
}
