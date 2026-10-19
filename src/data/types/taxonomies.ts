import type { WordPressRow } from "./common";
import type { TaxonomyKey } from "@/modules/content/taxonomies";

/** Includes migrated taxonomies that are not exposed in the public UI. */
export type StoredTaxonomy = TaxonomyKey | "post_tag" | "link_category"
  | "nav_menu" | "wp_theme" | "hp_vendor_languages" | "hp_vendor_services";

export type TermRow = WordPressRow & {
  taxonomy: StoredTaxonomy;
  name: string;
  slug: string;
  parent_id: number | null;
};

export type TermSummary = Pick<TermRow, "id" | "name" | "slug">;

export type PostTermRow = { post_id: number; term_id: number };
export type ListingTermRow = { listing_id: number; term_id: number };
