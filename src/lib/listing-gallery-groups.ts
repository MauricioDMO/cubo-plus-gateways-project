/**
 * The photo tour: which room each of a listing's photographs belongs to.
 *
 * Airbnb shows a property's photos grouped -- bedrooms, bathrooms, kitchen,
 * the pool -- and a guest scanning for "is there a second bathroom" finds the
 * answer without opening twenty images. This is that grouping.
 *
 * Where it is stored, and why it looks like this
 * ----------------------------------------------
 * One `attributes` key, `gallery_groups`, holding a JSON *string*. Two
 * constraints forced that shape:
 *
 *   - A new table needs a migration, and migrations here can only be run by
 *     the account owner in the SQL editor. 0005 has been waiting a while.
 *   - (admin form helper, removed) coerces every attribute value with
 *     String(value), because HivePress wrote the column as flat strings and
 *     the admin form still round-trips it that way. A nested object put in
 *     there arrives as "[object Object]".
 *
 * So: flat string in, flat string out, parsed here and nowhere else. Parsing
 * is total -- anything unrecognised yields no groups rather than throwing,
 * because a hand-edited attributes bag must not be able to break a property
 * page that is taking bookings.
 */

export const GALLERY_GROUPS_KEY = "gallery_groups";

/** The rooms offered in the admin, in the order a tour reads best. */
export const ROOM_LABELS = [
  "Living area",
  "Kitchen",
  "Dining",
  "Bedrooms",
  "Bathrooms",
  "Terrace",
  "Pool",
  "Views",
  "Building",
  "Neighbourhood",
] as const;

/** media id -> room label. */
export type GalleryGroups = Record<number, string>;

type Attributes = Record<string, unknown> | null | undefined;

export function parseGalleryGroups(attributes: Attributes): GalleryGroups {
  const raw = attributes?.[GALLERY_GROUPS_KEY];
  if (raw == null) return {};

  let decoded: unknown = raw;
  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return {};
    try {
      decoded = JSON.parse(text);
    } catch {
      return {};
    }
  }
  if (decoded == null || typeof decoded !== "object" || Array.isArray(decoded)) return {};

  const out: GalleryGroups = {};
  for (const [key, value] of Object.entries(decoded as Record<string, unknown>)) {
    const id = Number(key);
    if (!Number.isInteger(id)) continue;
    const label = typeof value === "string" ? value.trim() : "";
    if (label) out[id] = label;
  }
  return out;
}

/** The value to store. Empty groups return "" so the key drops out entirely. */
export function serializeGalleryGroups(groups: GalleryGroups): string {
  const entries = Object.entries(groups)
    .filter(([id, label]) => Number.isInteger(Number(id)) && label.trim())
    .map(([id, label]) => [String(Number(id)), label.trim()] as const);
  if (entries.length === 0) return "";
  return JSON.stringify(Object.fromEntries(entries));
}

export type GalleryTourGroup<T> = {
  label: string;
  media: T[];
};

/**
 * Builds the tour from a listing's gallery.
 *
 * Group order follows ROOM_LABELS rather than the order photos were tagged,
 * so every property's tour reads the same way -- a guest comparing two
 * listings is not re-learning the layout each time. Photos with no room are
 * kept in one leading group under `untaggedLabel`: dropping them would hide
 * photographs from the page, which is worse than showing them ungrouped.
 */
export function buildGalleryTour<T extends { id: number }>(
  media: T[],
  groups: GalleryGroups,
  untaggedLabel = "All photos"
): GalleryTourGroup<T>[] {
  const byLabel = new Map<string, T[]>();
  const untagged: T[] = [];

  for (const item of media) {
    const label = groups[item.id];
    if (!label) {
      untagged.push(item);
      continue;
    }
    const bucket = byLabel.get(label);
    if (bucket) bucket.push(item);
    else byLabel.set(label, [item]);
  }

  const ordered: GalleryTourGroup<T>[] = [];
  if (untagged.length > 0) ordered.push({ label: untaggedLabel, media: untagged });

  for (const label of ROOM_LABELS) {
    const bucket = byLabel.get(label);
    if (bucket) {
      ordered.push({ label, media: bucket });
      byLabel.delete(label);
    }
  }
  // Anything tagged with a label that is not in ROOM_LABELS -- an older tag,
  // or one typed by hand into the attributes JSON -- still gets shown.
  for (const [label, bucket] of byLabel) ordered.push({ label, media: bucket });

  return ordered;
}

/**
 * The id of the first photograph tagged as one of `rooms`, across a set of
 * listings, trying each room in the order given.
 *
 * For anywhere a page needs a photograph of a PLACE rather than of a unit.
 * A listing's cover is always an interior -- a sofa, a kitchen -- because that
 * is what sells the unit, and an interior says nothing on a card about a town
 * or a band about a coast. The room tags are what make a view, a pool or a
 * terrace findable.
 *
 * Returns null when nothing is tagged, and the caller falls back or renders
 * nothing rather than showing a sofa.
 */
export function pickPhotoIdByRoom(
  listings: Array<{ attributes: unknown }>,
  rooms: readonly string[],
  /**
   * Photographs already on the page. Without this the homepage showed the same
   * view of the same palms twice, a few hundred pixels apart -- the place card
   * and the concierge band both asked for "the first thing tagged Views" and
   * both got it.
   */
  exclude: ReadonlySet<number> = new Set()
): number | null {
  for (const room of rooms) {
    for (const listing of listings) {
      const groups = parseGalleryGroups(listing.attributes as Record<string, unknown>);
      for (const [id, label] of Object.entries(groups)) {
        if (label !== room) continue;
        const mediaId = Number(id);
        if (!exclude.has(mediaId)) return mediaId;
      }
    }
  }
  return null;
}
