/*
 * Presets for the listing form: the rate and policy block, filled in one press.
 *
 * Why this exists, measured against the ten properties on the site rather than
 * guessed at. Nine of the ten carry tourism_tax "5", nine carry pet_fee "100",
 * all ten check in at 15:00 and out at 11:00. The tenth -- casa-jungla -- has
 * neither the tax nor the pet fee, because somebody filling in fourteen boxes
 * by hand missed two of them. That is the whole argument for a preset: the
 * house terms are the same on nearly every property, so retyping them is not
 * work, it is an opportunity to get one wrong.
 *
 * Two kinds:
 *
 *   - HOUSE_DEFAULTS, the terms that apply unless a property says otherwise.
 *     A new listing starts from these, so the casa-jungla mistake cannot
 *     happen again by omission.
 *   - presetFromListing, "the same terms as <property>". The inventory is four
 *     buildings of near-identical apartments -- Golden Hour and Zonte Surfside
 *     are both 2B/2BA at $187 -- so the honest source of truth for a new
 *     apartment's rates is the twin already earning next door, not a constant
 *     in this file that somebody has to remember to update.
 *
 * Nothing here writes anything. A preset produces a patch, the form asks
 * presetChanges() what that patch would actually change, shows the list, and
 * only then applies it. An owner pressing "same as Sunset Surf" must not
 * discover afterwards that it quietly tripled the nightly rate.
 *
 * Prices and capacity are deliberately split: a preset never touches the
 * title, slug, photos, amenities, bedrooms, bathrooms or guest count. Those
 * are what makes a property itself.
 */

/** Attribute keys a preset is allowed to fill. Anything else is per-property. */
export const PRESET_ATTRIBUTE_KEYS = [
  "location",
  "price",
  "cleaning_fee",
  "tourism_tax",
  "pet_fee",
  "extra_guest_fee",
  "base_guests",
  "parking",
] as const;

export type PresetAttributeKey = (typeof PRESET_ATTRIBUTE_KEYS)[number];

/**
 * Labels for the "this is what will change" list.
 *
 * Shorter than the form's own labels on purpose: the form has room for
 * "Extra guest fee ($, per guest per night)", a one-line summary does not.
 */
const LABELS: Record<string, string> = {
  location: "Location",
  price: "Price per night",
  cleaning_fee: "Cleaning fee",
  tourism_tax: "Tourism tax",
  pet_fee: "Pet fee",
  extra_guest_fee: "Extra guest fee",
  base_guests: "Guests included",
  parking: "Parking spots",
  checkIn: "Check-in",
  checkOut: "Check-out",
  minStayNights: "Minimum stay",
  petsTermId: "Pets",
};

/**
 * The part of the form a preset can reach.
 *
 * Times are "HH:MM" as the <input type="time"> holds them, not the seconds the
 * attributes column stores, because a preset is applied to the form and the
 * form converts on save. Empty string means "not set" everywhere.
 */
export type PresetState = {
  values: Record<string, string>;
  checkIn: string;
  checkOut: string;
  /** Nights. "" is no minimum, which is a real setting, not an absent one. */
  minStayNights: string;
  /** Pets term id as the select holds it. */
  petsTermId: string;
};

/** A preset's contents. An absent field is "leave whatever is there". */
export type PresetPatch = {
  values?: Partial<Record<PresetAttributeKey, string>>;
  checkIn?: string;
  checkOut?: string;
  minStayNights?: string;
  petsTermId?: string;
};

export type ListingPreset = {
  id: string;
  label: string;
  blurb: string;
  patch: PresetPatch;
};

/**
 * The house terms.
 *
 * Every number here is the value nine or ten of the ten live properties
 * already carry -- this is a record of what the business does, not a proposal.
 * Deliberately absent: price (there is no house nightly rate), cleaning_fee
 * and extra_guest_fee (not charged on any property yet, and inventing a
 * default for money that reaches a guest's card is not this file's business),
 * base_guests (empty means "the same as Guests", which is what every property
 * means today).
 */
export const HOUSE_DEFAULTS: ListingPreset = {
  id: "house",
  label: "House defaults",
  blurb: "El Zonte, 5% tourism tax, $100 pet fee, 3pm to 11am, two nights minimum.",
  patch: {
    values: {
      location: "El Zonte, La Libertad",
      tourism_tax: "5",
      pet_fee: "100",
      parking: "1",
    },
    checkIn: "15:00",
    checkOut: "11:00",
    minStayNights: "2",
  },
};

/** The seconds-since-midnight the attributes column stores, as "HH:MM". */
function secondsToTime(seconds: string | undefined): string {
  if (seconds == null || String(seconds).trim() === "") return "";
  const n = Number(seconds);
  if (!Number.isFinite(n)) return "";
  const h = Math.floor(n / 3600) % 24;
  const m = Math.floor((n % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Keys "same as <property>" copies. Location is not one: it is the address. */
const COPIED_KEYS: PresetAttributeKey[] = [
  "price",
  "cleaning_fee",
  "tourism_tax",
  "pet_fee",
  "extra_guest_fee",
  "base_guests",
];

export type PresetSource = {
  id: number;
  title: string;
  attributes: Record<string, string> | null;
  pets_term_id: number | null;
};

/**
 * "The same terms as this property."
 *
 * Copies rates and policies, including the empty ones: if the property you
 * are copying from charges no cleaning fee, neither does this one. Filling
 * only the non-empty values would make "same as Golden Hour" mean something
 * different depending on what happened to be typed in already, which is the
 * one thing a preset must not do.
 */
export function presetFromListing(source: PresetSource): ListingPreset {
  const attrs = source.attributes ?? {};
  const values: Partial<Record<PresetAttributeKey, string>> = {};
  for (const key of COPIED_KEYS) values[key] = attrs[key] ?? "";

  return {
    id: `listing-${source.id}`,
    label: source.title,
    blurb: attrs.price ? `$${attrs.price} a night and the same fees.` : "The same fees and policies.",
    patch: {
      values,
      checkIn: secondsToTime(attrs.check_in),
      checkOut: secondsToTime(attrs.check_out),
      minStayNights: attrs.booking_min_length ?? "",
      petsTermId: source.pets_term_id != null ? String(source.pets_term_id) : "",
    },
  };
}

export type PresetChange = {
  /** The state field, for the key of a React list. */
  field: string;
  label: string;
  /** Human-readable, already formatted. "-" for an empty value. */
  from: string;
  to: string;
};

/** How a value reads in the change list. Empty is shown as a dash, not "". */
function display(field: string, value: string, petsLabel?: (id: string) => string): string {
  if (value.trim() === "") {
    return field === "minStayNights" ? "no minimum" : "empty";
  }
  if (field === "petsTermId") return petsLabel?.(value) ?? value;
  if (field === "minStayNights") return `${value} night${value === "1" ? "" : "s"}`;
  if (field === "tourism_tax") return `${value}%`;
  if (field === "price" || field === "cleaning_fee" || field === "pet_fee" || field === "extra_guest_fee") {
    return `$${value}`;
  }
  return value;
}

/**
 * What applying this preset would actually change, in form order.
 *
 * The form shows this before it applies anything. An empty list is the answer
 * to "did that button do nothing?" -- the preset matched what was already
 * there, which is worth saying out loud rather than leaving as silence.
 */
export function presetChanges(
  current: PresetState,
  patch: PresetPatch,
  petsLabel?: (id: string) => string
): PresetChange[] {
  const changes: PresetChange[] = [];

  const consider = (field: string, from: string, to: string | undefined) => {
    if (to == null) return;
    if ((from ?? "").trim() === to.trim()) return;
    changes.push({
      field,
      label: LABELS[field] ?? field,
      from: display(field, from ?? "", petsLabel),
      to: display(field, to, petsLabel),
    });
  };

  for (const key of PRESET_ATTRIBUTE_KEYS) {
    consider(key, current.values[key] ?? "", patch.values?.[key]);
  }
  consider("checkIn", current.checkIn, patch.checkIn);
  consider("checkOut", current.checkOut, patch.checkOut);
  consider("minStayNights", current.minStayNights, patch.minStayNights);
  consider("petsTermId", current.petsTermId, patch.petsTermId);

  return changes;
}

/** Applies the patch. Does not mutate; fields the patch omits are untouched. */
export function applyPreset(current: PresetState, patch: PresetPatch): PresetState {
  const values = { ...current.values };
  for (const key of PRESET_ATTRIBUTE_KEYS) {
    const next = patch.values?.[key];
    if (next != null) values[key] = next;
  }
  return {
    values,
    checkIn: patch.checkIn ?? current.checkIn,
    checkOut: patch.checkOut ?? current.checkOut,
    minStayNights: patch.minStayNights ?? current.minStayNights,
    petsTermId: patch.petsTermId ?? current.petsTermId,
  };
}
