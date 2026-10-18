import "server-only";
import path from "node:path";

import { getListingBySlug, getRelatedListings } from "@/modules/listings/server/listings";
import { getMediaByIds } from "@/shared/media/server/media";
import { readImageDimensions } from "@/shared/media/server/image-dimensions";
import { listingFallbackMedia, resolveGalleryIds } from "@/shared/media/media";
import { buildAmenityRows } from "@/modules/listings/amenities";
import { groupListingSections, isHtmlContent, parseListingContent } from "@/modules/listings/listing-content";
import { parseListingReviews } from "@/modules/listings/listing-reviews";
import { buildGalleryTour, parseGalleryGroups } from "@/modules/listings/listing-gallery-groups";
import { listingLocation } from "@/modules/listings/locations";
import { splitEditorContent } from "@/modules/content/editor-content";
import { attrValue } from "@/modules/bookings/booking-quote";
import { sanitizeContentHtml } from "@/shared/security/server/sanitize-html";

const nightlyRateFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export async function getListingDetailData(slug: string) {
  const listing = await getListingBySlug(slug);
  if (!listing) return null;
  const attrs = listing.attributes as Record<string, string>;
  const galleryIds = resolveGalleryIds(listing.featured_media_id, listing.gallery_media_ids);
  const fetchedMedia = await getMediaByIds(galleryIds);
  const mediaById = new Map(fetchedMedia.map((m) => [m.id, m]));
  const galleryMedia = galleryIds
    .map((id) => mediaById.get(id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  const fallbackMedia = listingFallbackMedia(listing.slug);
  const displayGalleryMedia = galleryMedia.length > 0 ? galleryMedia : fallbackMedia ? [fallbackMedia] : [];
  // Fallback media has no id: it can be a cover but cannot key tour tags.
  const listingReviews = parseListingReviews(listing.attributes);
  const tourMedia = await Promise.all(galleryMedia.map(async (media) => ({
    ...media,
    ...await readImageDimensions(path.join(process.cwd(), "public/media", media.storage_path)),
  })));
  const tourGroups = buildGalleryTour(tourMedia, parseGalleryGroups(attrs));
  const tourPhotoCount = tourGroups.reduce((sum, group) => sum + group.media.length, 0);
  const { css: descriptionCss, html: description } = splitEditorContent(listing.content_html);
  const descriptionHtml = isHtmlContent(description)
    ? sanitizeContentHtml(descriptionCss ? `<style>${descriptionCss}</style>${description}` : description)
    : null;
  const descriptionSections = descriptionHtml === null
    ? groupListingSections(parseListingContent(description))
    : { summary: [], sections: [] };
  const amenityRows = buildAmenityRows(attrs, { includeCheckTimes: true, pets: listing.pets });
  const rateValue = Number(attrValue(attrs, "price")?.replace(/[^\d.]/g, ""));
  const nightlyRate = Number.isFinite(rateValue) && rateValue > 0 ? nightlyRateFormatter.format(rateValue) : null;
  const relatedListings = await getRelatedListings(listing.id, 3);
  const category = listing.categories[0];
  const location = listingLocation(attrs);
  const checkoutMode: "checkout" | "contact" = process.env.NEXT_PUBLIC_SITE_URL ? "checkout" : "contact";
  return { listing, attrs, displayGalleryMedia, listingReviews, tourGroups, tourPhotoCount,
    descriptionHtml, descriptionSections, amenityRows, nightlyRate, relatedListings, category, location, checkoutMode };
}

export type ListingDetailData = NonNullable<Awaited<ReturnType<typeof getListingDetailData>>>;
