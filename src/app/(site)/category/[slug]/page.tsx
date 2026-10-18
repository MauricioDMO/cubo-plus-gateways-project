import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { getPostCategoriesWithCounts, getPostsByCategory } from "@/lib/content";
import PostCard from "@/components/PostCard";

/*
 * Blog category archive (Task 27), the /category/<slug>/ URL WordPress gives
 * every `category` term. The real site links here from its footer "Blog"
 * widget (Getaways Guides, Uncategorized) and from each post card's category
 * label. Cards reuse /blog's components/PostCard verbatim so the two
 * archives look like the same site.
 *
 * A category with no posts is a 404, not an empty state -- the same rule
 * listing categories already follow. Five terms came over from WordPress with
 * nothing filed under them (Tips, Trends, Ideas, Uncategorized, and now
 * Getaways Guides, whose posts were sorted into real sections), and each was
 * a page with a heading and nothing else for Google to index. An unknown slug
 * 404s too (see getPostsByCategory).
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPostsByCategory(slug);
  if (!result || result.posts.length === 0) return { title: "Not Found" };

  return {
    title: result.term.name,
    description: `Posts filed under ${result.term.name} in the Getaways El Salvador journal.`,
    alternates: { canonical: `/category/${slug}` },
  };
}

export default async function JournalCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [result, categories] = await Promise.all([
    getPostsByCategory(slug),
    getPostCategoriesWithCounts(),
  ]);
  if (!result || result.posts.length === 0) notFound();

  return (
    <div className="journal">
      <header className="journal__header">
        {/* The section, then the category. Landing here from a search result
            otherwise gives no clue what site you are on the journal of. */}
        <p className="journal__eyebrow">
          <Link href="/blog">Getaways Journal</Link>
        </p>
        <h1>{result.term.name}</h1>
      </header>

      {categories.length > 1 && (
        <nav className="journal__categories" aria-label="Journal categories">
          <Link href="/blog" className="journal__pill">
            All
          </Link>
          {categories.map((category) => {
            const active = category.slug === slug;
            return (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className={`journal__pill${active ? " journal__pill--active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {category.name}
                <span className="journal__pill-count">{category.count}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* No empty state: an empty category never reaches this point, it 404s
          above. */}
      <div className="post-grid">
        {result.posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
