import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getListingCategoriesWithCounts,
  getListingCategoryWithListings,
  visibleListingCategories,
} from "@/lib/content";
import { mediaPublicUrl } from "@/lib/media";
import PropertyArchive from "@/components/PropertyArchive";
import type { ArchiveSearchParams } from "@/lib/properties-filter";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getListingCategoryWithListings(slug);
  if (!result || result.listings.length === 0) return { title: "Not Found" };

  return {
    title: result.term.name,
    // Names the towns and the count. "in El Salvador" competed with every
    // rental site in the country and told a searcher nothing.
    description: `${result.listings.length} ${result.term.name.toLowerCase()} to rent in El Zonte, La Libertad. Book direct with no booking fees.`,
    alternates: { canonical: `/listing-category/${slug}` },
  };
}

export default async function ListingCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ArchiveSearchParams>;
}) {
  const { slug } = await params;
  const [result, sp, allCategories] = await Promise.all([
    getListingCategoryWithListings(slug),
    searchParams,
    getListingCategoriesWithCounts(),
  ]);
  // A category with no live property is a thin page: an empty grid under a
  // hero, which Google indexes and a guest bounces from. Deactivating the last
  // property in a category takes the category page down with it, and
  // reactivating one brings it back.
  if (!result || result.listings.length === 0) notFound();

  const { term } = result;
  const heroListing = result.listings.find((listing) => listing.featured_media);
  const heroUrl = heroListing?.featured_media ? mediaPublicUrl(heroListing.featured_media.storage_path) : null;
  const lead = `${term.name} in Surf City, close to the waves, restaurants and slow mornings by the coast.`;

  return (
    <div className="listing-category-page">
      <section
        className={`surf-category-hero${heroUrl ? " surf-category-hero--has-image" : ""}`}
        style={heroUrl ? { backgroundImage: `url(${heroUrl})` } : undefined}
      >
        <div className="surf-category-hero__content">
          <p className="surf-category-hero__eyebrow">
            <span className="surf-category-hero__count">
              {result.listings.length} {result.listings.length === 1 ? "Listing" : "Listings"}
            </span>
          </p>
          <h1>{term.name}</h1>
          <p>{lead}</p>
        </div>
      </section>

      <div className="properties-page">
        <PropertyArchive
          listings={result.listings}
          categories={visibleListingCategories(allCategories)}
          searchParams={sp}
          basePath={`/listing-category/${slug}`}
          categoryLinks
          activeCategorySlug={slug}
        />
      </div>
    </div>
  );
}
