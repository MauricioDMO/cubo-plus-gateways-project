import type { PageRow, PostRow } from "./types/content";
import type { CouponRow } from "./types/coupons";
import type { ListingRow } from "./types/listings";
import type { MediaRow } from "./types/media";
import type { ListingTermRow, PostTermRow, TermRow } from "./types/taxonomies";

// Keep the public import path stable; definitions live with their domain.
export type * from "./types/common";
export type * from "./types/content";
export type * from "./types/coupons";
export type * from "./types/listings";
export type * from "./types/media";
export type * from "./types/taxonomies";

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
