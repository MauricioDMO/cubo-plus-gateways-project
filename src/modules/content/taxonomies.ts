/**
 * The taxonomies, in the words an operator uses for them.
 *
 * The stored names are WordPress/HivePress internals -- `category`,
 * `hp_listing_category`, `hp_listing_pets` -- and none of them means anything
 * on screen. This is also the list that decides what the Categories screen
 * can create: a taxonomy nobody can name is a taxonomy nobody should be able
 * to add rows to.
 */
export const TAXONOMIES = [
  {
    key: "hp_listing_category",
    label: "Property categories",
    /** One item of this list, for button and field names ("Add property category"). */
    singular: "property category",
    /** What a term of this taxonomy is filed onto, singular: "Used by 3 properties." */
    filedOn: "property",
    blurb: "Group properties on the Properties page. Each group gets its own page on the website.",
    /** Where a term of this taxonomy is published. */
    path: (slug: string) => `/listing-category/${slug}`,
  },
  {
    key: "category",
    label: "Blog categories",
    singular: "blog category",
    filedOn: "post",
    blurb: "Group blog posts. Each group gets its own page on the website.",
    path: (slug: string) => `/category/${slug}`,
  },
  {
    key: "hp_listing_pets",
    label: "Pet policies",
    singular: "pet policy",
    filedOn: "property",
    blurb: "The choices in the Pets filter on the Properties page. They have no page of their own.",
    path: null,
  },
] as const;

export type TaxonomyKey = (typeof TAXONOMIES)[number]["key"];

export function taxonomyLabel(key: string): string {
  return TAXONOMIES.find((taxonomy) => taxonomy.key === key)?.label ?? key;
}

export function taxonomySingular(key: string): string {
  return TAXONOMIES.find((taxonomy) => taxonomy.key === key)?.singular ?? "category";
}

export function isKnownTaxonomy(key: string): key is TaxonomyKey {
  return TAXONOMIES.some((taxonomy) => taxonomy.key === key);
}

/** The public URL of a term, or null for a taxonomy that has no page. */
export function taxonomyTermPath(key: string, slug: string): string | null {
  const taxonomy = TAXONOMIES.find((entry) => entry.key === key);
  return taxonomy?.path ? taxonomy.path(slug) : null;
}
