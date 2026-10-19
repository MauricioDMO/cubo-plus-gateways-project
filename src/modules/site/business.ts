/*
 * The business's own identity: the NAP.
 *
 * One source of truth, because the whole value of a NAP is that it is
 * character-for-character identical everywhere it appears -- the footer, the
 * contact page, the structured data, and the Google Business Profile. Two
 * copies of a phone number is how they drift, and a drifted NAP is Google
 * failing to connect this site to that listing.
 *
 * What is NOT here is as deliberate as what is. `streetAddress`
 * is empty because nobody has supplied it, and a plausible-looking invented
 * address is far worse than a missing one: it would be published, crawled,
 * copied into aggregators, and then contradict the real Google listing
 * forever. Everything that reads this treats an empty string as "omit", so the
 * site is correct-but-incomplete today and complete the moment the missing values
 * below are filled in.
 */

export const BUSINESS = {
  name: "Getaways El Salvador",
  /** Matches the Google Business Profile, which publishes a Directions button. */
  legalName: "Getaways El Salvador",
  email: "getaways@goodlifeelsalvador.com",

  // Phone supplied by the site owner before the base synchronization.
  telephone: "+503 6062 7813",

  // ---- FILL THESE IN -----------------------------------------------------
  // These must match the Google Business Profile exactly, including format
  // ("Calle" vs "C.", suite present or absent). Until then they render as
  // nothing rather than as a guess.
  streetAddress: "",
  postalCode: "",
  // ------------------------------------------------------------------------

  addressLocality: "El Zonte",
  addressRegion: "La Libertad",
  addressCountry: "SV",

  /**
   * Towns the business actually rents in. Drives areaServed.
   *
   * Xanadu was here while Casa Jungla was on the books, and came off when that
   * house was sold. Surf City came off too, but for a different reason: it is
   * not a town, it is the name of the coast El Zonte sits on, and Solaris was
   * filed under it by mistake -- its own copy says "at Barefoot Surf & Sand in
   * El Zonte". Every apartment is in El Zonte.
   *
   * Claiming a service area with nothing to rent in it is the kind of thin
   * signal that costs trust rather than earning reach. Add a town back the day
   * there is a property in it.
   */
  serviceArea: ["El Zonte, La Libertad"],

  sameAs: [
    "https://www.instagram.com/getawayselsalvador/",
    "https://x.com/getaways_sv",
  ],

  priceRange: "$$",
  currenciesAccepted: "USD",
} as const;

/** The NAP as one line, for a footer or a citation. Omits what is unknown. */
export function formattedAddress(): string {
  return [BUSINESS.streetAddress, BUSINESS.addressLocality, BUSINESS.addressRegion, "El Salvador"]
    .filter(Boolean)
    .join(", ");
}

/** `tel:` href form -- digits and a leading +, nothing else. */
export function telHref(): string | null {
  const digits = BUSINESS.telephone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : null;
}

/**
 * The PostalAddress shape for schema.org, with unknown fields left out
 * entirely rather than emitted empty. An empty string in structured data is
 * a claim that the value is blank, which is not the same as not claiming it.
 */
export function postalAddressSchema() {
  return {
    "@type": "PostalAddress",
    ...(BUSINESS.streetAddress ? { streetAddress: BUSINESS.streetAddress } : {}),
    ...(BUSINESS.postalCode ? { postalCode: BUSINESS.postalCode } : {}),
    addressLocality: BUSINESS.addressLocality,
    addressRegion: BUSINESS.addressRegion,
    addressCountry: BUSINESS.addressCountry,
  };
}
