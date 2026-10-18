import { formatCheckTime } from "@/shared/utils/time";
import { priceFieldsFromAttributes } from "@/modules/bookings/booking-quote";
import type { AmenityIconKey } from "@/components/atoms/icons";

// Amenity checklist (extracted from app/listing/[slug]/page.tsx in Task 25 so
// the homepage's "Top Properties" cards and the listing detail page can share
// one definition instead of maintaining two copies of the same 14-row table).
//
// Matches the real WordPress/HivePress site's field set and order exactly.
// "Pets" isn't in this attribute-checkbox list -- it's a separate taxonomy
// (hp_listing_pets), passed into buildAmenityRows separately below. Each of
// these is a simple checkbox in HivePress:
// presence of the attribute key means "Yes", absence means the row is omitted
// entirely (HivePress itself never renders unchecked amenities), except
// `parking`, which HivePress treats as a number-of-spots field, so its raw
// string value is shown as-is instead of being coerced to "Yes".
//
// `icon` (Task 28) is the AmenityIconKey rendered before the label -- one per
// row, matching the real site's `<i class="hp-icon fas fa-fw fa-<glyph>">`
// before each attribute (see the comment in components/atoms/icons.tsx for the
// real glyph-per-key pairing this was verified against).
const AMENITY_CHECKBOXES: Array<{ key: string; label: string; icon: AmenityIconKey }> = [
  { key: "beachaccess", label: "Beach Access", icon: "beachaccess" },
  { key: "elevator", label: "Elevator", icon: "elevator" },
  { key: "oceanview", label: "Ocean View", icon: "oceanview" },
];
const AMENITY_CHECKBOXES_AFTER_PARKING: Array<{ key: string; label: string; icon: AmenityIconKey }> = [
  { key: "hammocks", label: "Hammock Area", icon: "hammocks" },
  { key: "gym", label: "Gym", icon: "gym" },
  { key: "firepit", label: "Fire Pit", icon: "firepit" },
  { key: "swimmingpool", label: "Swimming Pool", icon: "swimmingpool" },
  { key: "wifi", label: "WiFi", icon: "wifi" },
  { key: "tv", label: "TV", icon: "tv" },
  { key: "hotwater", label: "Hot Water", icon: "hotwater" },
  { key: "airconditioning", label: "Air Conditioning", icon: "airconditioning" },
];

/**
 * `wide` is a layout fact about the content, not a style: these rows carry a
 * phrase ("Allowed · $100 per stay", "Before 11:00 am") where every other row
 * carries "Yes" or a single figure. In a two-column grid the phrase wrapped,
 * and because grid rows share a height it dragged the short row beside it onto
 * two lines as well -- so "Bathrooms: 3" was 48px tall for no reason of its
 * own. A wide row takes the full width and every row stays one line.
 */
export type AmenityRow = { label: string; value: string; icon: AmenityIconKey; wide?: boolean };

export type SummaryItem = { label: string; value: number; icon: AmenityIconKey };

/**
 * The short capacity line shown on listing *cards* — guests, bedrooms and
 * bathrooms only, in the Airbnb convention ("6 guests · 3 bedrooms · 3 baths").
 * Cards used to render the full amenity checklist (up to 14 icon rows), which
 * buried the two or three numbers a guest actually scans for.
 *
 * Each entry is omitted when its attribute is missing rather than shown as
 * zero, so a listing that has never had a guest count set simply shows the
 * other two. `guests` is not part of the migrated HivePress attribute set —
 * it is read here so that listings gain the figure automatically once it is
 * filled in (the admin listing form now offers the field).
 */
export function buildListingSummary(attrs: Record<string, string>): SummaryItem[] {
  const items: SummaryItem[] = [];
  const num = (raw: string | undefined) => {
    const n = Number.parseInt(raw ?? "", 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const guests = num(attrs.guests);
  const bedrooms = num(attrs.bedrooms);
  const bathrooms = num(attrs.bathrooms);

  if (guests) items.push({ label: guests === 1 ? "guest" : "guests", value: guests, icon: "guests" });
  if (bedrooms) items.push({ label: bedrooms === 1 ? "bedroom" : "bedrooms", value: bedrooms, icon: "bedrooms" });
  if (bathrooms) items.push({ label: bathrooms === 1 ? "bath" : "baths", value: bathrooms, icon: "bathrooms" });

  return items;
}

// The /properties archive sidebar filter (functional filtering against
// Supabase-loaded listings, not a HivePress AJAX form) checks presence of
// these same attribute keys, in the same order as the checklist above minus
// "Parking" -- that one is a numeric minimum threshold, handled separately
// by the page since it isn't a boolean checkbox.
export function amenityFilterFields(): Array<{ key: string; label: string; icon: AmenityIconKey }> {
  return [...AMENITY_CHECKBOXES, ...AMENITY_CHECKBOXES_AFTER_PARKING];
}

/**
 * Builds the ordered amenity rows for a listing from its `attributes` jsonb.
 *
 * `includeCheckTimes` mirrors a real difference between the two places
 * HivePress renders this attribute group on the live site: the listing detail
 * page shows check-in/check-out times, while the homepage's listing *cards*
 * (its "secondary" attribute group) stop at Bedrooms/Bathrooms and never show
 * them. Verified against the rendered cards on getawayselsalvador.com.
 */
export function buildAmenityRows(
  attrs: Record<string, string>,
  { includeCheckTimes = false, pets }: { includeCheckTimes?: boolean; pets?: string | null } = {}
): AmenityRow[] {
  const rows: AmenityRow[] = [];

  for (const { key, label, icon } of AMENITY_CHECKBOXES) {
    if (key in attrs) rows.push({ label, value: "Yes", icon });
  }
  if (attrs.parking) rows.push({ label: "Parking", value: attrs.parking, icon: "parking" });
  for (const { key, label, icon } of AMENITY_CHECKBOXES_AFTER_PARKING) {
    if (key in attrs) rows.push({ label, value: "Yes", icon });
  }
  // Guests leads the capacity trio. It is not part of the migrated HivePress
  // field set (the live site has no such attribute), so it only appears once
  // the figure is filled in via the admin listing form.
  if (attrs.guests) rows.push({ label: "Guests", value: attrs.guests, icon: "guests" });
  if (attrs.bedrooms) rows.push({ label: "Bedrooms", value: attrs.bedrooms, icon: "bedrooms" });
  if (attrs.bathrooms) rows.push({ label: "Bathrooms", value: attrs.bathrooms, icon: "bathrooms" });
  /*
   * Pets: the money decides, and the taxonomy only refines it.
   *
   * Two sources used to answer this question and they disagreed out loud. The
   * pets term is a WordPress import and reads "Not Allowed" on every listing;
   * the checkout asks "Bringing a pet?" and charges whatever `pet_fee` says.
   * So a property page said pets were not allowed while its own checkout took
   * $100 for one.
   *
   * The fee wins, because it is the side that takes the money: if a property
   * charges for a pet, it accepts pets, and a row saying otherwise is simply
   * false. The taxonomy still refines WHICH pets -- "Cats Only", "Dogs Only"
   * -- and is only overruled when it flatly contradicts the fee. And the fee
   * itself joins the row, because "how much" is the guest's next question.
   */
  const petFeeCents = priceFieldsFromAttributes(attrs).petFeeCents;
  if (petFeeCents > 0) {
    const refinement = pets && !/not\s*allowed/i.test(pets) ? pets : "Allowed";
    const fee = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(petFeeCents / 100);
    rows.push({ label: "Pets", value: `${refinement} · ${fee} per stay`, icon: "pets", wide: true });
  } else if (pets) {
    // Wide like the fee branch above: a policy row, whatever its wording.
    rows.push({ label: "Pets", value: pets, icon: "pets", wide: true });
  }

  if (includeCheckTimes) {
    if (attrs.check_in) {
      rows.push({ label: "Check-in", value: `After ${formatCheckTime(attrs.check_in)}`, icon: "check_in", wide: true });
    }
    if (attrs.check_out) {
      rows.push({ label: "Check-out", value: `Before ${formatCheckTime(attrs.check_out)}`, icon: "check_out", wide: true });
    }
  }

  return rows;
}
