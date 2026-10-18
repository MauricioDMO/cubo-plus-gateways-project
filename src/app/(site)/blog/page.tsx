import type { Metadata } from "next";
import Link from "next/link";

import { getAllPosts, getPostCategoriesWithCounts } from "@/modules/content/server/content";
import PostCard from "@/components/molecules/PostCard";
import { siteText } from "@/modules/site/server/site-text";

/*
 * The journal.
 *
 * "Blog" everywhere in the chrome, "Getaways Guides" as the heading -- two
 * names for one thing, neither of them what this is called now. The URL stays
 * /blog: every post permalink, every inbound link and the sitemap point at it,
 * and renaming a path costs those for nothing a reader can see.
 */

export const metadata: Metadata = {
  title: "Journal",
  description: "Guides and stories about El Zonte, the La Libertad coast, and El Salvador.",
  alternates: { canonical: "/blog" },
};

export default async function JournalIndexPage() {
  const [posts, categories] = await Promise.all([getAllPosts(), getPostCategoriesWithCounts()]);
  const { text, edit } = await siteText();

  return (
    <div className="journal">
      <header className="journal__header">
        <h1 {...edit("blog.title", "Page heading")}>{text("blog.title")}</h1>
        <p className="journal__lead" {...edit("blog.lead", "Opening line")}>
          {text("blog.lead")}
        </p>
      </header>

      {/* Only worth showing when there is more than one thing to choose
          between. The pills mirror the photo tour's: this site already has a
          way of saying "pick a subset". */}
      {categories.length > 1 && (
        <nav className="journal__categories" aria-label="Journal categories">
          <span className="journal__pill journal__pill--active" aria-current="page">
            All
          </span>
          {categories.map((category) => (
            <Link key={category.slug} href={`/category/${category.slug}`} className="journal__pill">
              {category.name}
              <span className="journal__pill-count">{category.count}</span>
            </Link>
          ))}
        </nav>
      )}

      {posts.length === 0 ? (
        <p>No posts yet — check back soon.</p>
      ) : (
        <div className="post-grid">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
