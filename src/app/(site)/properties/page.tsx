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
    <div className="w-[min(100%_-_48px,_1240px)] mt-[clamp(36px,_5vw,_70px)] mb-20 mx-auto
      max-[860.001px]:w-[min(100%_-_32px,_720px)] max-[860.001px]:mt-4.5 max-[640.001px]:w-full">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Properties", path: "/properties" },
        ])}
      />

      {/* Names the coast rather than saying "Our Properties", which is a
          heading that could belong to any rental company anywhere. */}
      <h1 {...edit("properties.title", "Page heading", "text", { className: "mt-0 mb-7 mx-0 text-[clamp(40px,_5vw,_58px)] leading-[1.02] tracking-[0] text-heading max-[860.001px]:text-[clamp(26px,_7.5vw,_34px)] max-[860.001px]:mb-3.5" })}>{text("properties.title")}</h1>

      {/* Links into the per-town pages. Without these the destination pages
          would exist but be orphaned -- reachable only from a sitemap, which
          is not how a crawler decides a page matters. */}
      {destinations.length > 0 && (
        <nav className="flex flex-wrap mt-0 mb-4.5 mx-0 gap-2" aria-label="Destinations">
          {destinations.map((destination) => (
            <Link className="inline-flex items-center text-text text-[14px] no-underline px-3.25 py-1.75 gap-1.75 rounded-full border border-solid border-border hover:border-heading" key={destination.slug} href={`/destinations/${destination.slug}`}>
              {destination.label.split(",")[0]?.trim() ?? destination.label}
              <span className="bg-[rgba(15,_23,_39,_0.07)] text-[12px] px-1.75 py-0.25 rounded-full">{destination.count}</span>
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
