/*
 * The vocabulary of a concierge request, in the one place both sides can read.
 *
 * Keep the vocabulary client-safe: the form's checkboxes and URL prefill
 * parsing must agree on the services offered. This student build does not
 * submit requests to a concierge backend.
 */

/*
 * Two retirements, both of things that asked the guest to do the thinking.
 * "Custom vacation planning" and "Plan everything" were the same offer written
 * twice, one inside the grid and one as the card underneath it; the card won.
 * "Something else" was an empty box that only worked if the guest also wrote a
 * paragraph -- the notes field below the form already takes that, without
 * making anyone tick something first.
 *
 * Nothing else is retired, and nothing is invented. Every activity below is
 * one the owner confirmed can actually be arranged; a service on this list is
 * a promise the business has to keep.
 */
export const CONCIERGE_SERVICES = [
  "airport_transfer",
  "rental_car",
  "private_driver",
  "private_chef",
  "restaurant_reservations",
  "grocery_runs",
  "tours",
  "boat_trips",
  "waterfalls",
  "turtle_release",
  "surf_lessons",
  "hiking",
  "atv_motorbike",
  "horseback_riding",
  "plan_everything",
] as const;
export type ConciergeService = (typeof CONCIERGE_SERVICES)[number];

export const CONCIERGE_SERVICE_LABELS: Record<ConciergeService, string> = {
  airport_transfer: "Airport transfer",
  rental_car: "Rental car",
  private_driver: "Private driver",
  private_chef: "Private chef",
  restaurant_reservations: "Restaurant reservations",
  grocery_runs: "Grocery runs",
  tours: "Tours and day trips",
  boat_trips: "Boat and sunset trips",
  waterfalls: "Waterfalls and hot springs",
  turtle_release: "Turtle release",
  surf_lessons: "Surf lessons",
  hiking: "Hiking",
  atv_motorbike: "ATV and motorbike",
  horseback_riding: "Horseback riding",
  plan_everything: "Customize a full experience — we plan everything",
};

/*
 * Labels for services that are no longer offered.
 *
 * A stored request keeps whatever was ticked the day it was sent, so the
 * admin has to be able to read a word that the form no longer shows. There
 * are no such rows today -- the table is empty -- and this exists so that
 * retiring the next service is a one-line change rather than a blank cell in
 * somebody's enquiry.
 */
export const RETIRED_SERVICE_LABELS: Record<string, string> = {
  vacation_planning: "Custom vacation planning",
  something_else: "Something else",
};

/** What to call a service, whether or not it is still offered. */
export function conciergeServiceLabel(service: string): string {
  return (
    CONCIERGE_SERVICE_LABELS[service as ConciergeService] ??
    RETIRED_SERVICE_LABELS[service] ??
    service
  );
}

export type ConciergeServiceIconKey =
  | "plane"
  | "car"
  | "chef"
  | "utensils"
  | "map"
  | "boat"
  | "water"
  | "turtle"
  | "waves"
  | "mountain"
  | "bike"
  | "horse"
  | "steering"
  | "basket";

export const CONCIERGE_SERVICE_DETAILS: Record<
  Exclude<ConciergeService, "plan_everything">,
  { description: string; icon: ConciergeServiceIconKey }
> = {
  airport_transfer: {
    description: "Private pickup from San Salvador to your stay.",
    icon: "plane",
  },
  rental_car: {
    description: "A car ready where and when you need it.",
    icon: "car",
  },
  private_driver: {
    description: "Someone at the wheel for the day, or for the whole stay.",
    icon: "steering",
  },
  private_chef: {
    description: "A local chef cooking at your property.",
    icon: "chef",
  },
  restaurant_reservations: {
    description: "The right table, booked before it fills.",
    icon: "utensils",
  },
  grocery_runs: {
    description: "Tell us what you want in the kitchen. We shop and stock it before you arrive.",
    icon: "basket",
  },
  tours: {
    description: "Santa Ana, the Ruta de las Flores, coffee country, coast days.",
    icon: "map",
  },
  boat_trips: {
    description: "Out on the water at dawn, or back in for the sunset.",
    icon: "boat",
  },
  waterfalls: {
    description: "Tamanique, Juayúa, and the pools worth the walk in.",
    icon: "water",
  },
  turtle_release: {
    description: "Hatchlings down the sand at dusk. Season depending.",
    icon: "turtle",
  },
  surf_lessons: {
    description: "Trusted instructors for first waves or a stronger session.",
    icon: "waves",
  },
  hiking: {
    description: "Volcano rims, crater lakes, and the trails through the fincas.",
    icon: "mountain",
  },
  atv_motorbike: {
    description: "The dirt roads between the coast and the hills.",
    icon: "bike",
  },
  horseback_riding: {
    description: "A guided ride through the coast and countryside.",
    icon: "horse",
  },
};

/*
 * Four groups, named for what a guest is picking rather than for the moment of
 * the trip it happens in. `id` is carried rather than derived from the label:
 * "Food & Drinks".toLowerCase() is not a usable HTML id, and it was being used
 * as one.
 */
export const CONCIERGE_SERVICE_GROUPS = [
  { id: "travel", label: "Travel", services: ["airport_transfer", "rental_car", "private_driver"] },
  {
    id: "food",
    label: "Food & Drinks",
    services: ["private_chef", "restaurant_reservations", "grocery_runs"],
  },
  { id: "adventure", label: "Adventure", services: ["tours", "boat_trips", "waterfalls", "turtle_release"] },
  { id: "sports", label: "Sports", services: ["surf_lessons", "hiking", "atv_motorbike", "horseback_riding"] },
] as const satisfies readonly {
  id: string;
  label: string;
  services: readonly Exclude<ConciergeService, "plan_everything">[];
}[];

export const CALL_WINDOWS = ["morning", "afternoon"] as const;
export type CallWindow = (typeof CALL_WINDOWS)[number];

export const CONCIERGE_STATUSES = ["new", "contacted", "closed"] as const;
export type ConciergeStatus = (typeof CONCIERGE_STATUSES)[number];

export type ConciergeRequest = {
  id: number;
  created_at: string;
  updated_at: string;
  status: ConciergeStatus;
  name: string;
  email: string;
  phone: string | null;
  services: ConciergeService[];
  listing_slug: string | null;
  check_in: string | null;
  check_out: string | null;
  guests: number | null;
  call_day: string | null;
  call_window: CallWindow | null;
  message: string | null;
  admin_notes: string | null;
};

/**
 * The prefill a property page hands the form through the query string.
 *
 * Parsed rather than trusted: these values land in a form field and in a
 * mailto body, and they arrive in a URL anybody can write. A malformed date is
 * dropped instead of being shown back.
 */
export function parseConciergePrefill(params: Record<string, string | string[] | undefined>) {
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const date = (value: string | string[] | undefined) => {
    const raw = one(value);
    return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : undefined;
  };
  const slug = one(params.listing);
  const rawServices = Array.isArray(params.services)
    ? params.services
    : params.services
      ? [params.services]
      : [];
  const services = rawServices
    .flatMap((value) => value.split(","))
    .filter(
      (service, index, all): service is ConciergeService =>
        (CONCIERGE_SERVICES as readonly string[]).includes(service) && all.indexOf(service) === index
    );
  return {
    // Slugs on this site are lowercase words and hyphens; anything else came
    // from somebody experimenting with the URL bar.
    listingSlug: slug && /^[a-z0-9-]{1,200}$/.test(slug) ? slug : undefined,
    checkIn: date(params.check_in),
    checkOut: date(params.check_out),
    services,
  };
}

export function buildConciergeHref({
  service,
  listingSlug,
  checkIn,
  checkOut,
}: {
  service?: string;
  listingSlug?: string;
  checkIn?: string;
  checkOut?: string;
} = {}): string {
  const params = new URLSearchParams();
  if (service && (CONCIERGE_SERVICES as readonly string[]).includes(service)) {
    params.set("services", service);
  }
  if (listingSlug && /^[a-z0-9-]{1,200}$/.test(listingSlug)) {
    params.set("listing", listingSlug);
  }
  /* Dates, for the link offered after a booking is paid: the guest has just
     told us exactly when they are coming, and asking again on the next screen
     is asking a question we know the answer to. Same shape the reader accepts,
     checked here too so a bad value never reaches the query string. */
  if (checkIn && /^\d{4}-\d{2}-\d{2}$/.test(checkIn)) {
    params.set("check_in", checkIn);
  }
  if (checkOut && /^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
    params.set("check_out", checkOut);
  }
  const query = params.toString();
  return `/concierge${query ? `?${query}` : ""}#request`;
}

/**
 * The request as an email the guest sends themselves.
 *
 * Used when the store is unavailable — the migration has not been applied yet
 * — so a request still reaches somebody instead of being reported as a
 * failure. Built here rather than inline in the component so it can be tested:
 * the one thing that must not happen is a fallback that silently drops half
 * of what was typed.
 */
export function conciergeMailto(
  to: string,
  fields: {
    name: string;
    email: string;
    phone?: string;
    listingTitle?: string;
    listingSlug?: string;
    services: ConciergeService[];
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    callDay?: string;
    callWindow?: string;
    message?: string;
  }
): string {
  const property = fields.listingTitle || fields.listingSlug;
  const lines = [
    `Name: ${fields.name}`,
    `Email: ${fields.email}`,
    fields.phone ? `Phone: ${fields.phone}` : null,
    property ? `Property: ${property}` : null,
    fields.services.length > 0
      ? `Looking for: ${fields.services.map((service) => CONCIERGE_SERVICE_LABELS[service]).join(", ")}`
      : null,
    fields.checkIn ? `Check-in: ${fields.checkIn}` : null,
    fields.checkOut ? `Check-out: ${fields.checkOut}` : null,
    fields.guests ? `Guests: ${fields.guests}` : null,
    fields.callDay ? `Call: ${fields.callDay}${fields.callWindow ? ` (${fields.callWindow})` : ""}` : null,
    fields.message ? `\n${fields.message}` : null,
  ].filter(Boolean);

  const subject = fields.listingTitle ? `Planning a stay at ${fields.listingTitle}` : "Planning a stay";
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}
