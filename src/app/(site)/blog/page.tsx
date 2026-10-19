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
    <div className="w-[min(100%_-_48px,_1100px)] mt-[clamp(30px,_4vw,_52px)] mb-[clamp(56px,_7vw,_90px)] mx-auto max-[640.001px]:w-full">
      <header className="mt-0 mb-5.5 mx-0 [&_h1]:text-[clamp(32px,_4vw,_46px)] [&_h1]:leading-[1.12] [&_h1]:m-0">
        <h1 {...edit("blog.title", "Page heading")}>{text("blog.title")}</h1>
        <p className="max-w-[58ch] mt-3 mb-0 text-[17px] leading-[1.6] text-body-text mx-0" {...edit("blog.lead", "Opening line")}>
          {text("blog.lead")}
        </p>
      </header>

      {/* Only worth showing when there is more than one thing to choose
          between. The pills mirror the photo tour's: this site already has a
          way of saying "pick a subset". */}
      {categories.length > 1 && (
        <nav className="flex flex-wrap mt-0 mb-7 mx-0 gap-2" aria-label="Journal categories">
          <span className="inline-flex items-center min-h-10 bg-transparent text-body-text text-[14px] no-underline px-4 py-2 gap-1.75 rounded-full border
            border-solid border-border hover:border-[rgba(15,_23,_39,_0.45)] [&&]:text-heading [&&]:font-semibold
            [&&]:border-[rgba(15,_23,_39,_0.85)]" aria-current="page">
            All
          </span>
          {categories.map((category) => (
            <Link key={category.slug} href={`/category/${category.slug}`} className="inline-flex items-center min-h-10 bg-transparent text-body-text text-[14px] no-underline px-4 py-2 gap-1.75 rounded-full border
              border-solid border-border hover:border-[rgba(15,_23,_39,_0.45)]">
              {category.name}
              <span className="text-[12px] text-[rgba(15,_23,_39,_0.45)] tabular-nums">{category.count}</span>
            </Link>
          ))}
        </nav>
      )}

      {posts.length === 0 ? (
        <p>No posts yet — check back soon.</p>
      ) : (
        <div className="grid grid-cols-3 mx-0 my-6 gap-6 max-[960.001px]:grid-cols-2 max-[640.001px]:grid-cols-1">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
