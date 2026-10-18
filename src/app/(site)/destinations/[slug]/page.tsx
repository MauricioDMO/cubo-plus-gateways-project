import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import PropertyArchive from "@/components/PropertyArchive";
import JsonLd from "@/components/JsonLd";
import {
  getListingCategoriesWithCounts,
  getListingsForArchive,
  getMediaByIds,
  visibleListingCategories,
} from "@/lib/content";
import { mediaPublicUrl } from "@/lib/media";
import { parseSearchDates, unavailableListingIds } from "@/lib/availability-search";
import { collectDestinations, destinationSlug, matchesDestination } from "@/lib/locations";
import { breadcrumbSchema, destinationSchema } from "@/lib/structured-data";
import type { ArchiveSearchParams } from "@/lib/properties-filter";

/*
 * A page per town.
 *
 * The catalogue was reachable only through /properties and a query string,
 * which means the site had no page that was ABOUT El Zonte -- no title, no
 * H1, no URL naming it. "Vacation rental in El Zonte" is the search that
 * converts, and nothing here could rank for it.
 *
 * The towns come from the listings themselves (attributes.location), the same
 * source the homepage search bar reads, so a property added in a new town gets
 * a destination page without a code change and without a list to maintain.
 */

export const dynamic = "force-dynamic";

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function findDestination(slug: string) {
  const listings = await getListingsForArchive();
  const destination = collectDestinations(listings).find((d) => d.slug === destinationSlug(slug));
  return { destination, listings };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { destination, listings } = await findDestination(slug);
  if (!destination) return { title: "Not Found" };

  const town = destination.label.split(",")[0]?.trim() ?? destination.label;

  // The share card uses a photo of a property in that very town, which is a
  // better answer to "what does El Zonte look like" than the site-wide hero.
  const inTown = listings.filter((l) => matchesDestination(l.attributes, destination.slug));
  const coverId = inTown.map((l) => l.featured_media_id).find((id): id is number => id != null);
  const [coverMedia] = coverId ? await getMediaByIds([coverId]) : [];
  const cover = coverMedia ? mediaPublicUrl(coverMedia.storage_path) : undefined;

  const title = `Vacation Rentals in ${town}, El Salvador`;
  const description = `${destination.count} oceanfront ${
    destination.count === 1 ? "property" : "properties"
  } to rent in ${destination.label}. Book direct — no booking fees, local team on the coast.`;

  return {
    title,
    description,
    alternates: { canonical: `/destinations/${destination.slug}` },
    // images repeated on purpose: a page-level openGraph REPLACES the
    // layout's rather than merging with it, so omitting them here left the
    // destination pages with no share card at all.
    openGraph: {
      type: "website",
      title,
      description,
      url: `/destinations/${destination.slug}`,
      images: cover ? [{ url: cover, alt: `Vacation rentals in ${town}` }] : undefined,
    },
  };
}

export default async function DestinationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ArchiveSearchParams>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const { destination, listings } = await findDestination(slug);
  if (!destination) notFound();

  const inTown = listings.filter((listing) => matchesDestination(listing.attributes, destination.slug));

  const categories = await getListingCategoriesWithCounts();

  const dates = parseSearchDates(firstParam(sp.check_in), firstParam(sp.check_out));
  const unavailable = await unavailableListingIds(
    inTown.map((listing) => listing.id),
    dates
  );

  const town = destination.label.split(",")[0]?.trim() ?? destination.label;

  return (
    <div className="properties-page">
      <JsonLd data={destinationSchema(destination.label, destination.slug, destination.count)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Properties", path: "/properties" },
          { name: town, path: `/destinations/${destination.slug}` },
        ])}
      />

      <h1>Vacation rentals in {town}</h1>
      <p className="destination-intro">
        {destination.count} {destination.count === 1 ? "property" : "properties"} in{" "}
        {destination.label}, booked direct with our team on the coast.
      </p>

      <PropertyArchive
        listings={inTown}
        categories={visibleListingCategories(categories)}
        searchParams={sp}
        basePath={`/destinations/${destination.slug}`}
        unavailableListingIds={unavailable}
      />

      <p className="destination-back">
        <Link href="/properties">See every property</Link>
      </p>
    </div>
  );
}
