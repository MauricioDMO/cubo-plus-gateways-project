/** Identifiers retained from the WordPress migration. */
export type WordPressRow = {
  id: number;
  wp_id: number;
};

/** Fields shared by listings, pages and posts. */
export type ContentRow = WordPressRow & {
  slug: string;
  title: string;
  content_html: string;
};
