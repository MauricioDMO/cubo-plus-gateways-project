import type { ContentRow } from "./common";

type EditorialRow = ContentRow & {
  seo_title: string | null;
  seo_description: string | null;
};

/** Pages use WordPress's `publish`; posts use `published`. */
export type PageStatus = "publish" | "draft";
export type PostStatus = "published";

export type PageRow = EditorialRow & {
  status: PageStatus;
};

export type PostRow = EditorialRow & {
  excerpt: string;
  /** ISO timestamp, kept as a string in JSON. */
  published_at: string;
  author_wp_id: number;
  featured_media_id: number | null;
  status: PostStatus;
};
