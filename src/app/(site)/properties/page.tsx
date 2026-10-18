import type { Metadata } from "next";
import { getListingCategoriesWithCounts, getListingsForArchive, visibleListingCategories } from "@/lib/content";
import PropertyArchive from "@/components/PropertyArchive";
import type { ArchiveSearchParams } from "@/lib/properties-filter";
import { parseSearchDates, unavailableListingIds } from "@/lib/availability-search";
import { collectDestinations } from "@/lib/locations";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/structured-data";
import { siteText } from "@/lib/site-text";

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vacation Rentals in El Zonte, Surf City",
  // Named towns, not "in El Salvador": the previous copy competed for a
  // search nobody makes, and left the page indistinguishable from every other
  // rental site in the country.
  description:
    "Browse oceanfront apartments to rent in El Zonte, La Libertad, on El Salvador's Surf City coast. Book direct with no booking fees.",
  alternates: { canonical: "/properties" },
};

export default async function PropertiesIndexPage({
  searchParams,
}: {
  searchParams: Promise<ArchiveSearchParams>;
}) {
  const sp = await searchParams;
  const { text, edit } = await siteText();
  const [categories, listings] = await Promise.all([
    getListingCategoriesWithCounts(),
    getListingsForArchive(),
  ]);

  const destinations = collectDestinations(listings);
  const dates = parseSearchDates(firstParam(sp.check_in), firstParam(sp.check_out));
  const unavailable = await unavailableListingIds(
    listings.map((listing) => listing.id),
    dates
  );

  return (
    <div className="properties-page">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Properties", path: "/properties" },
        ])}
      />

      {/* Names the coast rather than saying "Our Properties", which is a
          heading that could belong to any rental company anywhere. */}
      <h1 {...edit("properties.title", "Page heading")}>{text("properties.title")}</h1>

      {/* Links into the per-town pages. Without these the destination pages
          would exist but be orphaned -- reachable only from a sitemap, which
          is not how a crawler decides a page matters. */}
      {destinations.length > 0 && (
        <nav className="destination-links" aria-label="Destinations">
          {destinations.map((destination) => (
            <Link key={destination.slug} href={`/destinations/${destination.slug}`}>
              {destination.label.split(",")[0]?.trim() ?? destination.label}
              <span>{destination.count}</span>
            </Link>
          ))}
        </nav>
      )}

      <PropertyArchive
        listings={listings}
        categories={visibleListingCategories(categories)}
        searchParams={sp}
        basePath="/properties"
        unavailableListingIds={unavailable}
      />
    </div>
  );
}
