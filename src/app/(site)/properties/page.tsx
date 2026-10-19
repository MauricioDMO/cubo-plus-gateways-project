import type { Metadata } from "next";
import { getListingCategoriesWithCounts, getListingsForArchive } from "@/modules/listings/server/listings";
import { visibleListingCategories } from "@/modules/listings/categories";
import PropertyArchive from "@/components/organisms/PropertyArchive";
import type { ArchiveSearchParams } from "@/modules/listings/properties-filter";
import { parseSearchDates, unavailableListingIds } from "@/modules/bookings/server/availability-search";
import { collectDestinations } from "@/modules/listings/locations";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/shared/seo/structured-data";
import { siteText } from "@/modules/site/server/site-text";

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
    <div className="[.listing-category-page_&]:mt-0 w-[min(100%_-_48px,_1240px)] mt-[clamp(36px,_5vw,_70px)] mb-20 mx-auto [&>h1]:mt-0 [&>h1]:mb-7
      [&>h1]:text-[clamp(40px,_5vw,_58px)] [&>h1]:leading-[1.02] [&>h1]:tracking-[0] [&>h1]:text-heading [&>h1]:mx-0
      max-[860.001px]:w-[min(100%_-_32px,_720px)] max-[860.001px]:mt-4.5
      [&>h1]:max-[860.001px]:text-[clamp(26px,_7.5vw,_34px)] [&>h1]:max-[860.001px]:mb-3.5 max-[640.001px]:w-full">
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
        <nav className="flex flex-wrap mt-0 mb-4.5 mx-0 gap-2 [&_a]:inline-flex [&_a]:items-center [&_a]:text-text [&_a]:text-[14px] [&_a]:no-underline
          [&_a]:px-3.25 [&_a]:py-1.75 [&_a]:gap-1.75 [&_a]:rounded-full [&_a]:border [&_a]:border-solid [&_a]:border-border
          [&_a:hover]:border-heading [&_a_span]:bg-[rgba(15,_23,_39,_0.07)] [&_a_span]:text-[12px] [&_a_span]:px-1.75 [&_a_span]:py-0.25
          [&_a_span]:rounded-full" aria-label="Destinations">
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
