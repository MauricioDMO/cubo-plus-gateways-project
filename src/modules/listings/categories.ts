// Preserve the original manually ordered categories; unknown categories follow alphabetically.
const LISTING_CATEGORY_ORDER = ["villas-for-rent-in-surf-city", "apartments"];

export function orderListingCategories<T extends { slug: string; name: string }>(categories: T[]): T[] {
  return [...categories].sort((a, b) => {
    const rank = (slug: string) => {
      const i = LISTING_CATEGORY_ORDER.indexOf(slug);
      return i < 0 ? LISTING_CATEGORY_ORDER.length : i;
    };
    return rank(a.slug) - rank(b.slug) || a.name.localeCompare(b.name);
  });
}

/** Empty categories are not navigation choices. */
export function visibleListingCategories<T extends { slug: string; name: string; listing_count: number }>(
  categories: T[]
): T[] {
  return orderListingCategories(categories.filter((category) => category.listing_count > 0));
}
