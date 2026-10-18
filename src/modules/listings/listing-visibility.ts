/**
 * Whether a property is shown on the public site.
 *
 * The flag lives in the listing's `attributes` JSON rather than in a column.
 * That is a deliberate trade: the schema lives in supabase/migrations, which
 * only the account owner can run, and migration 0005 has been waiting to be
 * applied for a while. A column would have meant this feature did nothing
 * until somebody opened the SQL editor. `attributes` is already a jsonb bag
 * the admin writes to, so the flag works the moment it is deployed.
 *
 * Everything reads it through here, so moving it to a real column later is a
 * change to this file and to the two writers, not a grep across the site.
 *
 * Absent means visible. The ten listings that already exist have no such key,
 * and defaulting to hidden would have taken the whole site down on deploy.
 */

/** The attributes key. Exported so the admin writer cannot drift from the reader. */
export const LISTING_ACTIVE_KEY = "active";

type Attributes = Record<string, unknown> | null | undefined;

export function isListingActive(attributes: Attributes): boolean {
  const value = attributes?.[LISTING_ACTIVE_KEY];
  if (value == null) return true;
  // Only an explicit, recognised "off" hides a property. A typo in the
  // attributes bag should not silently unpublish a listing that is earning.
  const text = String(value).trim().toLowerCase();
  return !(text === "false" || text === "0" || text === "no" || text === "off");
}

/** Returns the attributes to save with the flag set. Does not mutate. */
export function withListingActive(attributes: Attributes, active: boolean): Record<string, unknown> {
  const next = { ...(attributes ?? {}) };
  if (active) {
    // Removed rather than set to "true": an absent key is the default, and
    // carrying a redundant one into every listing makes the amenity bag
    // harder to read in the admin.
    delete next[LISTING_ACTIVE_KEY];
  } else {
    next[LISTING_ACTIVE_KEY] = "false";
  }
  return next;
}
