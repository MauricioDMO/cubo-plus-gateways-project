import type { ContentRow } from "./common";
import type { GalleryGroups } from "@/modules/listings/listing-gallery-groups";
import type { ListingReview } from "@/modules/listings/listing-reviews";

/** Native values for defining a property; absent means not specified, not zero. */
export type PropertyAttributes = {
  bedrooms?: number;
  /** May include a half bathroom, e.g. 2.5. */
  bathrooms?: number;
  /** Maximum guest capacity. */
  guests?: number;
  /** Guests included in the nightly rate. */
  base_guests?: number;
  /** Number of parking spaces. */
  parking?: number;
  location?: string;
  building?: string;

  /** Nightly rate and fees in USD, not cents. */
  price?: number;
  cleaning_fee?: number;
  extra_guest_fee?: number;
  pet_fee?: number;
  /** Percentage points: 13 means 13%, not 0.13. */
  iva?: number;
  tourism_tax?: number;
  /** Minimum stay in nights. */
  booking_min_length?: number;
  /** Seconds since midnight: 54000 means 15:00. */
  check_in?: number;
  check_out?: number;

  active?: boolean;
  pets_allowed?: boolean;
  airconditioning?: boolean;
  beachaccess?: boolean;
  elevator?: boolean;
  firepit?: boolean;
  gym?: boolean;
  hammocks?: boolean;
  hotwater?: boolean;
  oceanview?: boolean;
  swimmingpool?: boolean;
  tv?: boolean;
  wifi?: boolean;

  gallery_groups?: GalleryGroups;
  reviews?: ListingReview[];
  video_url?: string;
};

export type ListingAttributeKey = keyof PropertyAttributes;

/** Snapshot representation: even numbers, flags and nested JSON are strings. */
export type ListingAttributes = Partial<Record<ListingAttributeKey, string>>;

export type ListingRow = ContentRow & {
  featured_media_id: number | null;
  gallery_media_ids: number[];
  attributes: ListingAttributes;
};

/** A property defined with native attributes, not a raw JSON row. No implicit conversion. */
export type Property = Omit<ListingRow, "attributes"> & { attributes: PropertyAttributes };
