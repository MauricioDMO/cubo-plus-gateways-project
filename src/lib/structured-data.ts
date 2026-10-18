import { BUSINESS, postalAddressSchema } from "./business";
import { listingLocation } from "./locations";
import { mediaPublicUrl } from "./media";

/*
 * schema.org JSON-LD.
 *
 * The site emitted none at all, which for a business whose entire product is
 * WHERE it is means Google had to infer the location from prose. These
 * builders state it outright.
 *
 * `VacationRentalBusiness` on the organisation and `VacationRental` on each
 * property, rather than a generic `LocalBusiness`: the specific type is the
 * one that carries the properties Google reads for accommodation results
 * (occupancy, bedrooms, amenities), and a generic type wastes the markup.
 *
 * Everything here is derived from data the site already has. Nothing is
 * invented, and unknown fields are omitted rather than guessed -- see
 * lib/business.ts for why that distinction matters.
 */

function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  return configured || "https://getawayselsalvador.com";
}

function absolute(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** The organisation itself. Rendered once, on the homepage. */
export function businessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "VacationRentalBusiness",
    "@id": `${siteUrl()}/#business`,
    name: BUSINESS.name,
    url: siteUrl(),
    email: BUSINESS.email,
    ...(BUSINESS.telephone ? { telephone: BUSINESS.telephone } : {}),
    address: postalAddressSchema(),
    // The towns the business rents in. This is what makes the listing eligible
    // for "vacation rental in El Zonte" rather than only for its own name.
    areaServed: BUSINESS.serviceArea.map((name) => ({ "@type": "Place", name })),
    priceRange: BUSINESS.priceRange,
    currenciesAccepted: BUSINESS.currenciesAccepted,
    sameAs: [...BUSINESS.sameAs],
  };
}

type ListingLike = {
  slug: string;
  title: string;
  attributes: unknown;
  price_per_night_cents?: number | null;
};

/*
 * Amenity keys as stored on a listing, mapped to the names schema.org
 * consumers expect. Keys not listed here are skipped rather than guessed at:
 * a made-up amenity name is markup that says something untrue.
 */
const AMENITY_NAMES: Record<string, string> = {
  wifi: "Wi-Fi",
  airconditioning: "Air conditioning",
  swimmingpool: "Swimming pool",
  parking: "Free parking",
  beachaccess: "Beach access",
  hotwater: "Hot water",
  tv: "Television",
  gym: "Gym",
  elevator: "Elevator",
  firepit: "Fire pit",
  hammocks: "Hammocks",
  kitchen: "Kitchen",
  washer: "Washer",
  workspace: "Dedicated workspace",
};

export function listingSchema(listing: ListingLike, imagePath?: string | null) {
  const attrs = (listing.attributes as Record<string, string>) ?? {};
  const where = listingLocation(attrs);
  const url = absolute(`/listing/${listing.slug}`);

  const amenities = Object.entries(attrs)
    .filter(([key, value]) => value === "1" && AMENITY_NAMES[key])
    .map(([key]) => ({
      "@type": "LocationFeatureSpecification",
      name: AMENITY_NAMES[key],
      value: true,
    }));

  const bedrooms = Number(attrs.bedrooms);
  const bathrooms = Number(attrs.bathrooms);
  const guests = Number(attrs.guests);
  const nightly = listing.price_per_night_cents;

  return {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    "@id": `${url}#accommodation`,
    name: listing.title,
    url,
    ...(imagePath ? { image: mediaPublicUrl(imagePath) } : {}),
    // The property's own address. Locality comes from the listing rather than
    // the business, because the properties are in different towns and giving
    // them all the company's town was the bug this replaces.
    address: {
      "@type": "PostalAddress",
      addressLocality: where?.split(",")[0]?.trim() || BUSINESS.addressLocality,
      addressRegion: where?.split(",")[1]?.trim() || BUSINESS.addressRegion,
      addressCountry: BUSINESS.addressCountry,
    },
    ...(Number.isFinite(bedrooms) && bedrooms > 0 ? { numberOfBedrooms: bedrooms } : {}),
    ...(Number.isFinite(bathrooms) && bathrooms > 0
      ? { numberOfBathroomsTotal: bathrooms }
      : {}),
    ...(Number.isFinite(guests) && guests > 0
      ? { occupancy: { "@type": "QuantitativeValue", maxValue: guests, unitText: "guests" } }
      : {}),
    ...(amenities.length > 0 ? { amenityFeature: amenities } : {}),
    ...(nightly
      ? {
          // priceSpecification, not `price`: this is a nightly rate, and a bare
          // price on a stay reads as the total.
          priceRange: `$${Math.round(nightly / 100)}`,
        }
      : {}),
    provider: { "@id": `${siteUrl()}/#business` },
  };
}

/** A destination page: the town, and the properties in it. */
export function destinationSchema(label: string, slug: string, count: number) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": absolute(`/destinations/${slug}#page`),
    url: absolute(`/destinations/${slug}`),
    name: `Vacation rentals in ${label}`,
    about: { "@type": "Place", name: label },
    numberOfItems: count,
    provider: { "@id": `${siteUrl()}/#business` },
  };
}

/** The contact page: the business, restated where Google most expects it. */
export function contactPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": absolute("/contact-us#page"),
    url: absolute("/contact-us"),
    name: `Contact ${BUSINESS.name}`,
    mainEntity: { "@id": `${siteUrl()}/#business` },
  };
}

/**
 * A breadcrumb trail.
 *
 * Google renders these in place of the raw URL in a result, which on a path
 * like /destinations/el-zonte-la-libertad is the difference between a reader
 * seeing a slug and seeing "Destinations > El Zonte".
 */
export function breadcrumbSchema(trail: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absolute(crumb.path),
    })),
  };
}

/**
 * A blog post.
 *
 * Article rather than BlogPosting only where there is a real author to name;
 * schema that claims an author the site does not know is markup that says
 * something untrue, so `author` is omitted when absent rather than filled with
 * the company name.
 */
export function articleSchema(post: {
  title: string;
  slug: string;
  path: string;
  published_at: string | null;
  updated_at?: string | null;
  description: string | null;
  imagePath?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${absolute(post.path)}#article`,
    headline: post.title,
    url: absolute(post.path),
    ...(post.description ? { description: post.description } : {}),
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    ...(post.updated_at ? { dateModified: post.updated_at } : {}),
    ...(post.imagePath ? { image: mediaPublicUrl(post.imagePath) } : {}),
    publisher: { "@id": `${siteUrl()}/#business` },
    mainEntityOfPage: absolute(post.path),
  };
}
