/*
 * The homepage's own photographs and copy, made editable.
 *
 * Everything else on the homepage already comes from the database: the
 * listings, the destinations in the search bar, the journal posts, the town
 * names, even the phrase "apartments and villas" (derived from the categories
 * that actually exist, so it cannot go stale). What was NOT editable was the
 * handful of things the page names itself -- the hero photograph, the band
 * behind "Rent a Property", the category cards' photos, and the section
 * headings. Those were constants in app/(site)/page.tsx, which meant changing
 * the hero photograph was a code change and a deploy.
 *
 * WHY NOT THE VISUAL BUILDER
 *
 * There is a `home` row in the pages table with the original WordPress block
 * markup in it, and the page builder will happily open it -- but nothing
 * renders it, so editing it does nothing. It is not an oversight: the homepage
 * has a search bar wired to the catalogue, three carousels, and six listing
 * cards priced from the database. Handing that to a canvas would mean either
 * losing the live sections or rebuilding each one as a builder block first.
 * Slots are what makes the parts that ARE fixed editable today; dynamic
 * builder blocks are the bigger piece of work behind doing it the other way.
 *
 * WHERE IT IS STORED
 *
 * One row in the pages table -- slug `site-content`, status `draft` -- with
 * this JSON in its content_html. Not a table of its own, because that needs a
 * migration and migrations here can only be run by the account owner (0005
 * waited weeks); the same reason the listing visibility flag and the guest
 * reviews live in the attributes bag. `draft` is what keeps it off the public
 * site: getPageBySlug only returns published rows, so /site-content is a 404
 * while the homepage still reads the values directly.
 */

/** The slug of the pages row this lives in. */
export const SITE_CONTENT_SLUG = "site-content";

/*
 * Two more row identifiers retained from the original draft/publish workflow.
 *
 * Edits on the page land in the draft; visitors keep reading SITE_CONTENT_SLUG
 * until somebody presses Publish, which copies the draft over it and keeps the
 * set it replaced in the history row, twenty deep. Same table and same
 * `draft` status as the live row, for the same no-migration reason.
 */
export const SITE_CONTENT_DRAFT_SLUG = "site-content-draft";
export const SITE_CONTENT_HISTORY_SLUG = "site-content-history";

/*
 * What a slot holds.
 *
 *   text      plain words
 *   richtext  a paragraph or two: bold, italic and links, nothing else
 *   image     a media id
 *   href      where a button or link goes: a path on this site, https,
 *             mailto or tel (isSafeHref)
 *   list      a JSON array of items shaped by the slot's `item` schema --
 *             the team, the marquee words -- so items can be added, removed
 *             and reordered without anyone touching the layout
 */
export type SlotKind = "image" | "text" | "richtext" | "href" | "list" | LookKind;

/*
 * How something looks, as opposed to what it says -- stored beside the slot
 * it belongs to, under a suffix, one value for computers and one for phones:
 *
 *   <image slot>@focus / @focusMobile   where the photo sits in its frame
 *   <text slot>@align / @alignMobile    left, center or right
 *   <text slot>@size / @sizeMobile      a step smaller or bigger (SIZE_STEPS)
 *
 * Deliberately not free positioning: text and buttons stay where the design
 * put them, which is what keeps a page working on a phone.
 */
export type LookKind = "focus" | "align" | "size";

export type ListFieldKind = "text" | "richtext" | "image" | "href" | "focus";

export type ListField = { key: string; kind: ListFieldKind; label: string; required?: boolean };

export type ListSchema = {
  /** What one item is called on the buttons: "+ Add person". */
  noun: string;
  fields: ListField[];
  max?: number;
};

/** One stored list item. Every field is a string, like every other value. */
export type ListItem = { id: string } & Record<string, string>;

export type ContentSlot = {
  id: string;
  kind: SlotKind;
  label: string;
  /** Shown under the field. Say where on the page it lands. */
  hint?: string;
  /** What the page shows when the slot is empty. */
  fallback?: string;
  /**
   * True when the default is worked out at render time rather than fixed --
   * the towns the catalogue covers, or a heading that changes with which tier
   * of cards is showing. The form then says "worked out from your properties"
   * instead of quoting today's value as though it were the default.
   */
  derived?: boolean;
  /**
   * True when empty is a real answer rather than a missing one.
   *
   * The phone number and the street address are blank on purpose: an invented
   * address gets crawled and copied into aggregators, and then contradicts
   * the real Google listing forever. So these have no default to fall back
   * to, and the page renders nothing at all until somebody types the true
   * one.
   */
  optional?: boolean;
  /** An image slot's default photograph, by media id. */
  fallbackMediaId?: number;
  /** A list slot's item shape. Every list slot has one. */
  item?: ListSchema;
};

export type SlotGroup = {
  id: string;
  title: string;
  blurb: string;
  /** The page the group is on, for "Edit on this page". Absent: every page. */
  page?: string;
  slots: ContentSlot[];
};

/*
 * Two tokens, so editable copy keeps the one property the hardcoded copy had.
 *
 * The hero subtitle and the tagline named "El Zonte, Xanadu and Surf City"
 * and "apartments and villas" as literal strings once. The day the Xanadu
 * house was sold, all three sentences became claims the site could not back
 * with a bookable property. They are derived now -- and an editable box would
 * hand that problem straight back, so the boxes take tokens instead.
 */
export const CONTENT_TOKENS = {
  stays: "{stays}",
  towns: "{towns}",
} as const;

export type TokenValues = { stays: string; towns: string };

export function applyTokens(text: string, values: TokenValues): string {
  return text
    .split(CONTENT_TOKENS.stays)
    .join(values.stays)
    .split(CONTENT_TOKENS.towns)
    .join(values.towns);
}

/*
 * The slots, grouped the way the admin screen shows them.
 *
 * A group is one band of a page. Making something editable is one entry here
 * plus one `text(id)` or `chosenUrl(id)` at the call site -- the point of the
 * registry is that the second copy of the words lives in exactly one place,
 * so a default cannot drift from what the page renders.
 */
export const CONTENT_GROUPS: SlotGroup[] = [
  {
    id: "home.hero",
    page: "/",
    title: "Homepage — the hero",
    blurb: "The photograph, the headline and the two buttons at the very top.",
    slots: [
      { id: "home.hero.image", kind: "image", label: "Hero photograph", hint: "Full width, behind the headline." },
      {
        id: "home.hero.eyebrow",
        kind: "text",
        label: "Eyebrow",
        hint: "The small line above the headline. Left empty it lists the towns you actually cover.",
        derived: true,
      },
      { id: "home.hero.title", kind: "text", label: "Headline", fallback: "Book direct on the coast" },
      {
        id: "home.hero.subtitle",
        kind: "text",
        label: "Subheadline",
        hint: "{stays} becomes the kinds of property you list; {towns} the towns you cover.",
        fallback: "Oceanfront {stays}, booked direct with us.",
      },
      { id: "home.hero.primaryLabel", kind: "text", label: "First button", fallback: "SEE PROPERTIES" },
      { id: "home.hero.primaryHref", kind: "href", label: "First button link", fallback: "/properties" },
      { id: "home.hero.secondaryLabel", kind: "text", label: "Second button", fallback: "Talk to us" },
      { id: "home.hero.secondaryHref", kind: "href", label: "Second button link", fallback: "/contact-us" },
      {
        id: "home.tagline",
        kind: "text",
        label: "Tagline under the search bar",
        hint: "Takes {stays} and {towns} too.",
        fallback: "Oceanfront {stays} in {towns}, booked direct.",
      },
    ],
  },
  {
    id: "home.places",
    page: "/",
    title: "Homepage — where you can stay",
    blurb:
      "The two-up grid under the tagline. It shows your categories while two of them have live properties, then towns, then buildings — so the cards change with the catalogue, and each photograph is editable whichever tier is showing.",
    slots: [
      {
        id: "home.places.title",
        kind: "text",
        label: "Heading",
        hint: "Left empty it names what is actually shown — buildings, towns or categories.",
        derived: true,
      },
      { id: "home.places.subtitle", kind: "text", label: "Subheading", derived: true },
    ],
  },
  {
    id: "home.categories",
    page: "/",
    title: "Homepage — categories",
    blurb:
      "Only rendered while two categories each have a live property. With one, the grid above shows towns or buildings instead.",
    slots: [
      { id: "home.categories.title", kind: "text", label: "Heading", fallback: "Top Categories" },
      {
        id: "home.categories.subtitle",
        kind: "text",
        label: "Subheading",
        fallback: "Explore the most popular categories.",
      },
    ],
  },
  {
    id: "home.concierge",
    page: "/",
    title: "Homepage — concierge",
    blurb: "The band offering transfers, cars and tours.",
    slots: [
      {
        id: "home.concierge.image",
        kind: "image",
        label: "Photograph",
        hint: "Left empty the page picks a terrace or pool photo from a live property. Set one to pin it.",
      },
      { id: "home.concierge.title", kind: "text", label: "Heading", fallback: "Getaways Concierge" },
      {
        id: "home.concierge.subtitle",
        kind: "text",
        label: "Subheading",
        fallback: "Arrive, eat, explore, or plan the whole thing with one local point of contact.",
      },
      {
        id: "home.concierge.ctaLabel",
        kind: "text",
        label: "Button",
        hint: "It opens the concierge form with “plan everything” picked.",
        fallback: "Plan my stay",
      },
    ],
  },
  {
    id: "home.properties",
    page: "/",
    title: "Homepage — properties",
    blurb: "The carousel of six properties. The cards come from your listings.",
    slots: [
      { id: "home.properties.title", kind: "text", label: "Heading", fallback: "Top Properties" },
      {
        id: "home.properties.subtitle",
        kind: "text",
        label: "Subheading",
        fallback: "Oceanfront favorites ready for your next stay.",
      },
      { id: "home.properties.linkLabel", kind: "text", label: "Link beside the heading", fallback: "View all properties" },
      { id: "home.properties.linkHref", kind: "href", label: "Where that link goes", fallback: "/properties" },
      {
        id: "home.properties.cardCta",
        kind: "text",
        label: "Button on each property card",
        hint: "Each one opens its own property.",
        fallback: "View stay",
      },
    ],
  },
  {
    id: "home.journal",
    page: "/",
    title: "Homepage — journal",
    blurb: "The three most recent posts. The cards come from your posts.",
    slots: [
      { id: "home.journal.title", kind: "text", label: "Heading", fallback: "From the Journal" },
      {
        id: "home.journal.subtitle",
        kind: "text",
        label: "Subheading",
        fallback: "Guides and stories from the coast, written by the people who live on it.",
      },
    ],
  },
  {
    id: "home.cta",
    page: "/",
    title: "Homepage — Rent a Property / Become a Host",
    blurb: "The two-column band at the foot of the homepage.",
    slots: [
      { id: "home.cta.image", kind: "image", label: "Background photograph", hint: "Sits behind both columns." },
      { id: "home.cta.leftTitle", kind: "text", label: "Left heading", fallback: "Rent a Property" },
      { id: "home.cta.leftLabel", kind: "text", label: "Left button", fallback: "Find a Property" },
      { id: "home.cta.leftHref", kind: "href", label: "Left button link", fallback: "/properties" },
      { id: "home.cta.rightTitle", kind: "text", label: "Right heading", fallback: "Become a Host" },
      { id: "home.cta.rightLabel", kind: "text", label: "Right button", fallback: "List a Property" },
      { id: "home.cta.rightHref", kind: "href", label: "Right button link", fallback: "/contact-us" },
    ],
  },
  /*
   * The About page.
   *
   * Every default is the page exactly as it was designed and hardcoded before
   * it became editable, so nothing on it changes until somebody edits it.
   * Photos default to the media rows uploaded for the redesign.
   */
  {
    id: "about.hero",
    page: "/about",
    title: "About — the hero",
    blurb: "The group photo and the words over it.",
    slots: [
      {
        id: "about.hero.image",
        kind: "image",
        label: "Hero photo (computer)",
        hint: "Landscape. Shown on computers and tablets.",
        fallbackMediaId: 2198,
      },
      {
        id: "about.hero.imageMobile",
        kind: "image",
        label: "Hero photo (phone)",
        hint: "Portrait. Shown on phones, where a landscape photo would cut people off the sides.",
        fallbackMediaId: 2210,
      },
      { id: "about.hero.eyebrow", kind: "text", label: "Eyebrow", fallback: "El Zonte · La Libertad · Pacific Coast" },
      { id: "about.hero.title", kind: "text", label: "Headline", fallback: "More than just a vacation." },
      {
        id: "about.hero.subtitle",
        kind: "text",
        label: "Subheadline",
        fallback: "A boutique rental and property management team, rooted on El Salvador's Pacific coast.",
      },
    ],
  },
  {
    id: "about.story",
    page: "/about",
    title: "About — our story",
    blurb: "The story, the moving words under it, and the large photo.",
    slots: [
      { id: "about.story.eyebrow", kind: "text", label: "Section label", fallback: "Our Story" },
      { id: "about.story.title", kind: "text", label: "Heading", fallback: "We didn't set out to run a rental company." },
      {
        id: "about.story.body",
        kind: "richtext",
        label: "Story",
        fallback:
          "<p>Getaways El Salvador grew out of Goodlife Real Estate Consulting, after more than five years spent learning this coast property by property — who owns what, what a place is really worth, and what makes it work for the people who stay there.</p>" +
          "<p>So the move into rental and property management wasn't really a pivot. It was the same local knowledge, pointed at a new problem: getting homeowners more from their property, and getting travelers more from their stay.</p>",
      },
      {
        id: "about.marquee",
        kind: "list",
        label: "Moving words",
        item: { noun: "word", max: 20, fields: [{ key: "text", kind: "text", label: "Word", required: true }] },
        fallback: JSON.stringify([
          { id: "surf", text: "Surf Culture" },
          { id: "golden", text: "Golden Hour" },
          { id: "bitcoin", text: "Bitcoin Beach" },
          { id: "jungle", text: "Jungle Villas" },
          { id: "sunsets", text: "Pacific Sunsets" },
        ]),
      },
      { id: "about.story.image", kind: "image", label: "Large photo", fallbackMediaId: 2199 },
    ],
  },
  {
    id: "about.quote",
    page: "/about",
    title: "About — the quote",
    blurb: "The large quote and the paragraph under it.",
    slots: [
      {
        id: "about.quote.text",
        kind: "text",
        label: "Quote",
        fallback: "El Zonte doesn't really have a rush hour. That's the point.",
      },
      {
        id: "about.quote.body",
        kind: "richtext",
        label: "Paragraph",
        fallback:
          "<p>El Zonte is still small — a stretch of Pacific coast known for good surf, golden light, and the Bitcoin Beach community that put it on the map. We live here, which is the real difference between us and a booking platform. When something needs handling, someone already knows the answer, because they're down the street.</p>",
      },
      { id: "about.quote.closing", kind: "text", label: "Closing line", fallback: "Your stay, curated from the ground up." },
    ],
  },
  {
    id: "about.team",
    page: "/about",
    title: "About — the team",
    blurb: "The people, in order. A quote is optional: a card without one is not clickable.",
    slots: [
      { id: "about.team.eyebrow", kind: "text", label: "Section label", fallback: "Meet The Team" },
      { id: "about.team.title", kind: "text", label: "Heading", fallback: "The people behind every stay." },
      {
        id: "about.team.intro",
        kind: "text",
        label: "Intro",
        fallback:
          "No call center. No script. Just a local team on the ground in El Zonte — the same people who answer your messages, meet you at the door, and know exactly which sunset spot to send you to.",
      },
      {
        id: "about.team.members",
        kind: "list",
        label: "Team",
        item: {
          noun: "person",
          max: 40,
          fields: [
            { key: "photo", kind: "image", label: "Photo" },
            { key: "name", kind: "text", label: "Name", required: true },
            { key: "role", kind: "text", label: "Role", required: true },
            { key: "quote", kind: "text", label: "Quote" },
            { key: "photoFocus", kind: "focus", label: "Photo position" },
          ],
        },
        fallback: JSON.stringify([
          { id: "lexi", photo: "2200", name: "Lexi", role: "Founder and CEO", quote: "" },
          { id: "andrea", photo: "2201", name: "Andrea", role: "Housekeeper", quote: "" },
          {
            id: "mafer",
            photo: "2202",
            name: "Mafer",
            role: "Head of Marketing",
            quote:
              "I love spending my free time outdoors — hitting the beach, catching waves, and losing myself on the dance floor.",
          },
          {
            id: "xiomara",
            photo: "2203",
            name: "Xiomara",
            role: "Guest Experience Lead",
            quote:
              "After work, I love going for a run and catching a beautiful sunset on the beach. Good coworkers make the whole day better.",
          },
          { id: "isabella", photo: "2204", name: "Isabella", role: "Guest Experience Lead", quote: "" },
          { id: "tatiana", photo: "2205", name: "Tatiana", role: "Housekeeper", quote: "" },
          {
            id: "maureen",
            photo: "2206",
            name: "Maureen",
            role: "Content Creation",
            quote:
              "What I love most about El Zonte is that it's a place that inspires you — life moves slower here, without so much rush.",
          },
          {
            id: "vanessa",
            photo: "2207",
            name: "Vanessa",
            role: "Head of Design and Project Delivery",
            quote:
              "I love traveling and discovering new places — it shapes how I see spaces. In El Zonte, I design spaces that reflect the coast and the local way of life.",
          },
          {
            id: "raquel",
            photo: "2208",
            name: "Raquel",
            role: "Operations Manager",
            quote:
              "I love staying organized, working as a team, and always giving my best. In my free time, I enjoy watching the sunset and spending time with my family.",
          },
          { id: "consuelo", photo: "2209", name: "Consuelo", role: "Housekeeper", quote: "" },
        ]),
      },
    ],
  },
  {
    id: "header",
    title: "The menu bar",
    blurb: "At the top of every page.",
    slots: [
      { id: "header.cta.label", kind: "text", label: "Menu button", fallback: "List a Property" },
      { id: "header.cta.href", kind: "href", label: "Where the menu button goes", fallback: "/contact-us" },
    ],
  },
  {
    id: "pages",
    title: "The other pages",
    blurb: "The heading and the opening line each page leads with.",
    slots: [
      {
        id: "properties.title",
        kind: "text",
        label: "Properties page heading",
        fallback: "Vacation rentals on the La Libertad coast",
      },
      { id: "blog.title", kind: "text", label: "Journal page heading", fallback: "Getaways Journal" },
      {
        id: "blog.lead",
        kind: "text",
        label: "Journal page opening line",
        fallback:
          "Where to eat, where to surf, and what the coast is actually like — written by the people who live on it.",
      },
      { id: "concierge.eyebrow", kind: "text", label: "Concierge eyebrow", fallback: "Getaways Concierge" },
      { id: "concierge.title", kind: "text", label: "Concierge heading", fallback: "Your stay, fully arranged" },
      {
        id: "concierge.lead",
        kind: "text",
        label: "Concierge opening line",
        fallback: "Tell us what you want. We will handle the details, from the airport to the last dinner.",
      },
    ],
  },
  {
    id: "footer",
    title: "The footer",
    blurb: "On every page of the site.",
    slots: [
      {
        id: "footer.tagline",
        kind: "text",
        label: "Footer tagline",
        fallback: "Property & Rental Management in El Salvador",
      },
      { id: "footer.properties.title", kind: "text", label: "Properties column", fallback: "Properties" },
      { id: "footer.journal.title", kind: "text", label: "Journal column", fallback: "Journal" },
      { id: "footer.social.title", kind: "text", label: "Social column", fallback: "Social" },
    ],
  },
  {
    id: "business",
    title: "How people reach you",
    blurb:
      "Shown in the footer and handed to Google as structured data. The phone number and the street address are empty today, which is why neither appears anywhere on the site.",
    slots: [
      {
        id: "business.telephone",
        kind: "text",
        optional: true,
        label: "Phone number",
        hint: "Write it exactly as the Google Business Profile has it. Empty means the site shows none.",
      },
      {
        id: "business.streetAddress",
        kind: "text",
        optional: true,
        label: "Street address",
        hint: "Also exactly as Google has it. Empty means the site shows none.",
      },
      { id: "business.email", kind: "text", label: "Email", fallback: "getaways@goodlifeelsalvador.com" },
    ],
  },
];

/** Every fixed slot, flattened. */
export const ALL_SLOTS: ContentSlot[] = CONTENT_GROUPS.flatMap((group) => group.slots);

/**
 * The photograph on one card of the "where you can stay" grid.
 *
 * Keyed by the card's own key -- a building slug, a destination slug or a
 * category slug, depending on which tier is showing -- so an override
 * survives the tier changing under it.
 */
export function placeImageSlotId(cardKey: string): string {
  return `home.place.${cardKey}.image`;
}

/** The slot id for one listing category's card photo. */
export function categoryImageSlotId(categorySlug: string): string {
  return `home.category.${categorySlug}.image`;
}

/* -------------------------------------------------------------- the values */

/** Slot id -> value. An image slot holds a media id as a string. */
export type SiteContent = Record<string, string>;

/**
 * Reads the stored JSON.
 *
 * Total: anything unrecognised yields no overrides rather than throwing,
 * because every one of these values is read while rendering the homepage and
 * a hand-edited row must not be able to take the front page down.
 */
export function parseSiteContent(raw: string | null | undefined): SiteContent {
  if (!raw) return {};
  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    return {};
  }
  if (decoded == null || typeof decoded !== "object" || Array.isArray(decoded)) return {};

  const out: SiteContent = {};
  for (const [key, value] of Object.entries(decoded as Record<string, unknown>)) {
    if (typeof value !== "string") continue;
    const text = value.trim();
    // An empty slot is an absent slot: that is how "use the default" is
    // stored, and it keeps a cleared field from writing "" over a fallback.
    if (text) out[key] = text;
  }
  return out;
}

export function serializeSiteContent(values: SiteContent): string {
  const kept = Object.entries(values)
    .map(([key, value]) => [key, String(value ?? "").trim()] as const)
    .filter(([, value]) => value !== "");
  return JSON.stringify(Object.fromEntries(kept), null, 2);
}

/** The text for a slot: what was set, else the slot's own default. */
export function slotText(content: SiteContent, slot: ContentSlot, tokens: TokenValues): string {
  const raw = content[slot.id] ?? slot.fallback ?? "";
  return applyTokens(raw, tokens);
}

/** The media id for an image slot, or null when it is not set. */
export function slotMediaId(content: SiteContent, slotId: string): number | null {
  const raw = content[slotId];
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/* ------------------------------------------------------- slots by id, kinds */

const SLOT_BY_ID = new Map(ALL_SLOTS.map((slot) => [slot.id, slot]));

export function slotById(id: string): ContentSlot | undefined {
  return SLOT_BY_ID.get(id);
}

/*
 * Slot ids that are generated rather than listed: one per card or category,
 * keyed by its slug (placeImageSlotId, categoryImageSlotId above). The write
 * API accepts a key only if it is a registry slot or matches one of these --
 * before, it accepted any key at all.
 */
export const SLOT_PATTERNS: ReadonlyArray<{ pattern: RegExp; kind: SlotKind }> = [
  { pattern: /^home\.place\.[a-z0-9-]+\.image$/, kind: "image" },
  { pattern: /^home\.category\.[a-z0-9-]+\.image$/, kind: "image" },
];

function baseKindFor(key: string): SlotKind | null {
  const slot = SLOT_BY_ID.get(key);
  if (slot) return slot.kind;
  return SLOT_PATTERNS.find((entry) => entry.pattern.test(key))?.kind ?? null;
}

const LOOK_SUFFIX = /^(.+)@(focus|align|size)(Mobile)?$/;

/** Which look a kind of slot can take. */
const LOOKS_FOR: Partial<Record<SlotKind, LookKind[]>> = {
  image: ["focus"],
  text: ["align", "size"],
  richtext: ["align", "size"],
};

/** What a key holds, or null when it is not an editable part of the site. */
export function slotKindFor(key: string): SlotKind | null {
  const look = LOOK_SUFFIX.exec(key);
  if (!look) return baseKindFor(key);
  const base = baseKindFor(look[1]);
  const kind = look[2] as LookKind;
  return base && LOOKS_FOR[base]?.includes(kind) ? kind : null;
}

export function lookKey(slotId: string, look: LookKind, mobile: boolean): string {
  return `${slotId}@${look}${mobile ? "Mobile" : ""}`;
}

/* ------------------------------------------------------------------- looks */

/** The size steps offered: a little smaller, the design's own, a little bigger. */
export const SIZE_STEPS = [0.8, 0.9, 1, 1.15, 1.3, 1.5] as const;

export function isFocusValue(value: string | undefined): value is string {
  const match = value ? /^(\d{1,3})% (\d{1,3})%$/.exec(value) : null;
  return Boolean(match && Number(match[1]) <= 100 && Number(match[2]) <= 100);
}

export function isAlignValue(value: string | undefined): value is "left" | "center" | "right" {
  return value === "left" || value === "center" || value === "right";
}

export function isSizeValue(value: string | undefined): value is string {
  return value != null && (SIZE_STEPS as readonly number[]).includes(Number(value)) && value.trim() !== "";
}

/** "37.4% 120%" -> "37% 100%", or null when it is not a position. */
export function normalizeFocus(raw: string): string | null {
  const match = /^\s*(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%\s*$/.exec(raw);
  if (!match) return null;
  const clamp = (n: number) => Math.round(Math.min(100, Math.max(0, n)));
  return `${clamp(Number(match[1]))}% ${clamp(Number(match[2]))}%`;
}

export type LookProps = { className?: string; style?: Record<string, string> };

/**
 * The class and CSS variables that apply a slot's alignment and size, merged
 * with the element's own class. Rendered for visitors too -- this is how it
 * looks, not an editing aid. Each Tailwind variant applies at its own breakpoint.
 */
export function lookProps(content: SiteContent, slotId: string, baseClass?: string): LookProps {
  const classes = baseClass ? [baseClass] : [];
  const style: Record<string, string> = {};
  const align = content[lookKey(slotId, "align", false)];
  const alignMobile = content[lookKey(slotId, "align", true)];
  const size = content[lookKey(slotId, "size", false)];
  const sizeMobile = content[lookKey(slotId, "size", true)];
  const add = (className: string, variable: string, value: string) => {
    classes.push(className);
    style[variable] = value;
  };
  if (isAlignValue(align)) add("min-[641px]:[text-align:var(--gx-align)]!", "--gx-align", align);
  if (isAlignValue(alignMobile)) add("max-[640.001px]:[text-align:var(--gx-align-m)]!", "--gx-align-m", alignMobile);
  if (isSizeValue(size)) add("min-[641px]:[zoom:var(--gx-size)]", "--gx-size", size);
  if (isSizeValue(sizeMobile)) add("max-[640.001px]:[zoom:var(--gx-size-m)]", "--gx-size-m", sizeMobile);
  return {
    className: classes.length > 0 ? classes.join(" ") : undefined,
    style: Object.keys(style).length > 0 ? style : undefined,
  };
}

/**
 * Where a photo sits in its frame, on computers and on phones. `background`
 * for a CSS background photo (the homepage hero) rather than an <img>.
 */
export function focusProps(
  desktop: string | undefined,
  mobile: string | undefined,
  background = false,
  baseClass?: string
): LookProps {
  const classes = baseClass ? [baseClass] : [];
  const style: Record<string, string> = {};
  if (isFocusValue(desktop)) {
    classes.push(background ? "min-[641px]:[background-position:var(--gx-focus)]!" : "min-[641px]:object-[var(--gx-focus)]!");
    style["--gx-focus"] = desktop;
  }
  if (isFocusValue(mobile)) {
    classes.push(background ? "max-[640.001px]:[background-position:var(--gx-focus-m)]!" : "max-[640.001px]:object-[var(--gx-focus-m)]!");
    style["--gx-focus-m"] = mobile;
  }
  return {
    className: classes.length > 0 ? classes.join(" ") : undefined,
    style: Object.keys(style).length > 0 ? style : undefined,
  };
}

export function usesTokens(value: string): boolean {
  return Object.values(CONTENT_TOKENS).some((token) => value.includes(token));
}

/**
 * True while a slot's words are worked out by the page -- a derived default,
 * or a default with {towns}/{stays} in it -- and nobody has overridden them.
 * The editor says so, because typing over one turns it into fixed text.
 */
export function isAutoSlot(content: SiteContent, id: string): boolean {
  if (content[id]) return false;
  const slot = SLOT_BY_ID.get(id);
  return Boolean(slot && (slot.derived || usesTokens(slot.fallback ?? "")));
}

/* ------------------------------------------------------------ plain values */

/** One line of plain text: no control characters, whitespace collapsed. */
export function cleanPlainText(raw: string): string {
  return raw
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Where a button or a link may point.
 *
 * A path on this site, a full http(s) link, mailto: or tel:. Nothing else --
 * `javascript:` and `data:` are how a link runs code, and "//host" is a
 * protocol-relative jump to another site dressed up as a path.
 */
export function isSafeHref(raw: string): boolean {
  const href = raw.trim();
  if (!href || href.length > 2000 || /[\u0000-\u001f\u007f]/.test(href)) return false;
  if (/^tel:\+?[0-9()\-. ]{3,}$/i.test(href)) return true;
  if (/\s/.test(href)) return false;
  if (href.startsWith("/")) return !href.startsWith("//") && !href.includes("\\");
  if (href.startsWith("#")) return href.length > 1;
  return /^https?:\/\/[^/?#\\]+/i.test(href) || /^mailto:[^@\s]+@[^@\s]+$/i.test(href);
}

/* ------------------------------------------------------------------- lists */

export const LIST_MAX_ITEMS = 50;
export const LIST_ITEM_ID = /^[A-Za-z0-9_-]{1,40}$/;

function decodeArray(raw: string | null | undefined): unknown[] | null {
  if (!raw) return null;
  try {
    const decoded: unknown = JSON.parse(raw);
    return Array.isArray(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

/**
 * Reads a stored list. Total, like parseSiteContent: an item that is not an
 * object, has no usable id, or repeats one is dropped; a missing field is "".
 */
export function parseList(raw: string | null | undefined, schema: ListSchema): ListItem[] {
  const decoded = decodeArray(raw) ?? [];
  const seen = new Set<string>();
  const items: ListItem[] = [];
  for (const entry of decoded) {
    if (entry == null || typeof entry !== "object" || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    const id = typeof record.id === "string" && LIST_ITEM_ID.test(record.id) ? record.id : null;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const item: ListItem = { id };
    for (const field of schema.fields) {
      const value = record[field.key];
      item[field.key] = typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
    }
    items.push(item);
    if (items.length >= (schema.max ?? LIST_MAX_ITEMS)) break;
  }
  return items;
}

/**
 * A list slot's items: what was stored, else its default.
 *
 * A stored list that cannot be read falls back to the default rather than to
 * nothing -- a hand-edited row must not be able to empty the team off the
 * page. A stored "[]" is a real answer (every item removed) and stays empty.
 */
export function slotList(content: SiteContent, slot: ContentSlot): ListItem[] {
  if (slot.kind !== "list" || !slot.item) return [];
  const stored = content[slot.id];
  const source = stored != null && decodeArray(stored) != null ? stored : slot.fallback;
  return parseList(source, slot.item);
}

/** False while an item is missing a required field. Visitors never see one. */
export function isCompleteItem(item: ListItem, schema: ListSchema): boolean {
  return schema.fields.every((field) => !field.required || (item[field.key] ?? "").trim() !== "");
}

/* ------------------------------------------------------------------- media */

function positiveId(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export type MediaUse = { id: number; where: string };

/**
 * Every photograph the site content shows, and where.
 *
 * What the page shows, not only what was stored: an image slot left at its
 * default still shows its default photo, and the team still shows its default
 * people. Used to fetch every photo a page needs in one query, and by the
 * media library to refuse deleting a photo the site is still using.
 */
export function mediaInUse(content: SiteContent): MediaUse[] {
  const uses: MediaUse[] = [];
  for (const group of CONTENT_GROUPS) {
    for (const slot of group.slots) {
      if (slot.kind === "image") {
        const id = positiveId(content[slot.id]) ?? slot.fallbackMediaId ?? null;
        if (id) uses.push({ id, where: `${group.title} — ${slot.label}` });
        continue;
      }
      if (slot.kind !== "list" || !slot.item) continue;
      const imageFields = slot.item.fields.filter((field) => field.kind === "image");
      if (imageFields.length === 0) continue;
      for (const item of slotList(content, slot)) {
        const nameField = slot.item.fields.find((field) => field.kind === "text" && (item[field.key] ?? "").trim());
        const name = nameField ? item[nameField.key] : slot.item.noun;
        for (const field of imageFields) {
          const id = positiveId(item[field.key]);
          if (id) uses.push({ id, where: `${group.title} — ${name}` });
        }
      }
    }
  }
  for (const [key, value] of Object.entries(content)) {
    if (SLOT_BY_ID.has(key)) continue;
    if (SLOT_PATTERNS.find((entry) => entry.pattern.test(key))?.kind !== "image") continue;
    const id = positiveId(value);
    if (id) uses.push({ id, where: `Homepage — card photo (${key})` });
  }
  return uses;
}

/* ------------------------------------------------------------ editor state */

/** What the editor works on: the draft (or live, when there is no draft). */
export type EditorState = { values: SiteContent; unpublished: number };

/** One past publish, as the Versions list shows it. */
export type VersionSummary = { publishedAt: string; changes: number };
