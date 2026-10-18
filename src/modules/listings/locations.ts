/*
 * Destinations.
 *
 * A listing's town lives in `attributes.location` as free text the admin types
 * ("El Zonte, La Libertad"). Nothing enumerates the towns ahead of time --
 * the set of destinations is whatever the listings say it is, so adding a
 * property in a new town makes that town appear in the search bar with no
 * code change.
 *
 * Matching is done on a slug rather than the raw string so that a stray comma,
 * accent or capital in the admin field can't split one town into two
 * destinations. "El Zonte, La Libertad" and "el zonte, la libertad" both
 * become "el-zonte-la-libertad".
 */

export type Destination = {
  /** URL-safe key used in the ?destination= query param. */
  slug: string;
  /** The label as typed by the admin, e.g. "El Zonte, La Libertad". */
  label: string;
  /** How many listings sit in this destination. */
  count: number;
};

export function destinationSlug(location: string): string {
  return location
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function listingLocation(attributes: unknown): string | null {
  const attrs = (attributes as Record<string, string>) ?? {};
  const raw = attrs.location?.trim();
  return raw ? raw : null;
}

/**
 * Just the town: "El Zonte" out of "El Zonte, La Libertad".
 *
 * The department is what a destination PAGE is for; on a card it is eleven
 * characters that are identical on every property in the catalogue.
 *
 * Lives here rather than in one archive component because three surfaces now
 * print it -- /properties, the category pages and the homepage carousel -- and
 * a card that says "El Zonte" on one screen and "El Zonte, La Libertad" on the
 * next reads as two different places.
 */
export function listingTown(attributes: unknown): string | null {
  const location = listingLocation(attributes);
  if (!location) return null;
  const town = location.split(",")[0]?.trim();
  return town || null;
}

/**
 * Collects the distinct destinations across a set of listings, ordered by
 * listing count (most properties first) and then alphabetically, which is
 * the order the search bar offers them in.
 */
export function collectDestinations(listings: Array<{ attributes: unknown }>): Destination[] {
  const bySlug = new Map<string, Destination>();
  for (const listing of listings) {
    const label = listingLocation(listing.attributes);
    if (!label) continue;
    const slug = destinationSlug(label);
    const existing = bySlug.get(slug);
    if (existing) {
      existing.count += 1;
    } else {
      bySlug.set(slug, { slug, label, count: 1 });
    }
  }
  return [...bySlug.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function matchesDestination(attributes: unknown, destination: string): boolean {
  const label = listingLocation(attributes);
  if (!label) return false;
  return destinationSlug(label) === destinationSlug(destination);
}
