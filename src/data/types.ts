import type { TaxonomyKey } from "@/modules/content/taxonomies";
import type { PublicCouponView } from "@/modules/coupons/coupon-rules";
import type { CouponQuote } from "@/modules/coupons/pricing";
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

export type ListingRow = {
  id: number;
  wp_id: number;
  slug: string;
  title: string;
  content_html: string;
  featured_media_id: number | null;
  gallery_media_ids: number[];
  attributes: ListingAttributes;
};

/** A property defined with native attributes, not a raw JSON row. No implicit conversion. */
export type Property = Omit<ListingRow, "attributes"> & { attributes: PropertyAttributes };

/** Pages use WordPress's `publish`; posts use `published`. */
export type PageStatus = "publish" | "draft";
export type PostStatus = "published";

export type PageRow = {
  id: number;
  wp_id: number;
  slug: string;
  title: string;
  content_html: string;
  seo_title: string | null;
  seo_description: string | null;
  status: PageStatus;
};

export type PostRow = {
  id: number;
  wp_id: number;
  slug: string;
  title: string;
  content_html: string;
  excerpt: string;
  /** ISO timestamp, kept as a string in JSON. */
  published_at: string;
  author_wp_id: number;
  seo_title: string | null;
  seo_description: string | null;
  featured_media_id: number | null;
  status: PostStatus;
};

export type MediaRow = {
  id: number;
  wp_id: number;
  storage_path: string;
  original_filename: string;
  alt_text: string | null;
};

/** Includes migrated taxonomies that are not exposed in the public UI. */
export type StoredTaxonomy = TaxonomyKey | "post_tag" | "link_category"
  | "nav_menu" | "wp_theme" | "hp_vendor_languages" | "hp_vendor_services";

export type TermRow = {
  id: number;
  wp_id: number;
  taxonomy: StoredTaxonomy;
  name: string;
  slug: string;
  parent_id: number | null;
};

export type PostTermRow = { post_id: number; term_id: number };
export type ListingTermRow = { listing_id: number; term_id: number };

export type CouponRow = CouponQuote & PublicCouponView & {
  code: string;
  note: string | null;
};

/** Row contracts for the eight JSON snapshots; not joined view models. */
export type DataTables = {
  pages: PageRow;
  posts: PostRow;
  listings: ListingRow;
  media: MediaRow;
  terms: TermRow;
  post_terms: PostTermRow;
  listing_terms: ListingTermRow;
  coupons: CouponRow;
};
