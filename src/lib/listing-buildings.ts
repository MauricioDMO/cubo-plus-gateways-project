/**
 * Which building or community a property sits in.
 *
 * Six of the apartments are in Zonset Surf Residences and three are in
 * Barefoot Surf & Sand. Both are in El Zonte, both are oceanfront, and the
 * photographs look alike -- which is exactly how a guest ends up enquiring
 * about the wrong one. Grouping the archive by building is the fix.
 *
 * Stored in `attributes.building` for the same reason as the active flag:
 * see lib/listing-visibility.ts. The value is the building's real name as the
 * listing's own copy writes it, not a slug, so the admin field is free text
 * and a new building needs no code change.
 */

export const LISTING_BUILDING_KEY = "building";

type Attributes = Record<string, unknown> | null | undefined;

export function listingBuilding(attributes: Attributes): string | null {
  const value = attributes?.[LISTING_BUILDING_KEY];
  if (value == null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

/** Stable key for grouping, so "Barefoot Surf & Sand" and a stray "barefoot surf & sand" land together. */
export function buildingKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export type BuildingGroup<T> = {
  /** The building's name, or null for the properties that belong to no building. */
  building: string | null;
  listings: T[];
};

/**
 * Splits listings into building groups, preserving the order they arrive in.
 *
 * Whatever sort or filter the archive applied stays intact inside each group:
 * grouping is not allowed to quietly reorder a "price, low to high" result.
 * Properties with no building come last as a single unnamed group -- a villa
 * or a house is not "other", it simply has no building to be confused with.
 */
export function groupByBuilding<T extends { attributes?: unknown }>(listings: T[]): BuildingGroup<T>[] {
  const groups = new Map<string, BuildingGroup<T>>();
  const unassigned: T[] = [];

  for (const listing of listings) {
    const name = listingBuilding(listing.attributes as Attributes);
    if (!name) {
      unassigned.push(listing);
      continue;
    }
    const key = buildingKey(name);
    const existing = groups.get(key);
    if (existing) existing.listings.push(listing);
    else groups.set(key, { building: name, listings: [listing] });
  }

  const ordered = [...groups.values()];
  if (unassigned.length > 0) ordered.push({ building: null, listings: unassigned });
  return ordered;
}
