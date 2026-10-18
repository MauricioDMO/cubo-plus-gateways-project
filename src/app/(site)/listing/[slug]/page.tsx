import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ListingTemplate from "@/components/templates/ListingTemplate";
import { getListingDetailData } from "@/modules/listings/server/detail";
import { getListingBySlug } from "@/modules/listings/server/listings";
import { getMediaByIds } from "@/shared/media/server/media";
import { listingFallbackMedia, mediaPublicUrl, resolveGalleryIds } from "@/shared/media/media";
import { listingLocation } from "@/modules/listings/locations";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return { title: "Not Found" };
  const attrs = listing.attributes as Record<string, string>;
  const where = listingLocation(attrs) ?? "El Salvador";
  const sleeps = Number(attrs.guests);
  const description = [
    `${attrs.bedrooms ? attrs.bedrooms + " bedroom, " : ""}${
      attrs.bathrooms ? attrs.bathrooms + " bathroom " : ""
    }vacation rental in ${where}`,
    Number.isFinite(sleeps) && sleeps > 0 ? `Sleeps ${sleeps}` : null,
    "Book direct with Getaways El Salvador",
  ]
    .filter(Boolean)
    .join(". ") + ".";
  const galleryIds = resolveGalleryIds(listing.featured_media_id, listing.gallery_media_ids);
  const [cover] = await getMediaByIds(galleryIds.slice(0, 1));
  const image = cover
    ? mediaPublicUrl(cover.storage_path)
    : listingFallbackMedia(listing.slug)
      ? mediaPublicUrl(listingFallbackMedia(listing.slug)!.storage_path)
      : undefined;
  return {
    title: listing.title,
    description,
    alternates: { canonical: `/listing/${slug}` },
    openGraph: {
      type: "website",
      title: listing.title,
      description,
      url: `/listing/${slug}`,
      ...(image ? { images: [{ url: image, alt: listing.title }] } : {}),
    },
  };
}

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getListingDetailData(slug);
  if (!data) notFound();
  return <ListingTemplate data={data} />;
}
