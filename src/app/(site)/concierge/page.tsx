import type { Metadata } from "next";
import Image from "next/image";

import ConciergeForm from "@/components/organisms/ConciergeForm";
import JsonLd from "@/components/seo/JsonLd";
import { BUSINESS } from "@/modules/site/business";
import { parseConciergePrefill } from "@/modules/concierge/concierge-shared";
import { getFeaturedListings, getListingBySlug } from "@/modules/listings/server/listings";
import { getMediaByIds } from "@/shared/media/server/media";
import { pickPhotoIdByRoom } from "@/modules/listings/listing-gallery-groups";
import { mediaPublicUrl } from "@/shared/media/media";
import { breadcrumbSchema } from "@/shared/seo/structured-data";
import { siteText } from "@/modules/site/server/site-text";

/*
 * The concierge page.
 *
 * A hardcoded route, which takes precedence over the [...segments] catch-all,
 * so a `pages` row with this slug could never shadow it.
 *
 * No icons in circles and no numbered steps. The first version had both and
 * they were the wrong language for this business: a circled glyph over a bold
 * noun over a line of grey text, three times, is how software is sold. This is
 * a coast. A photograph, then the week written out as an index, then the form.
 *
 * No prices, deliberately: what a transfer or a tour costs depends on the day,
 * the group and who is free, and a number printed here is one quoted back at
 * us in March.
 */

export const metadata: Metadata = {
  title: "Concierge",
  description:
    "Airport transfers, private chefs, restaurant reservations, surf lessons, day trips and complete vacation planning on El Salvador's coast.",
  alternates: { canonical: "/concierge" },
};

const HERO_ROOMS = ["Views", "Pool", "Neighbourhood", "Terrace"];

export default async function ConciergePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const prefill = parseConciergePrefill(await searchParams);
  const { text, edit } = await siteText();

  const [listing, listings] = await Promise.all([
    // The title, not just the slug, so the request says which property and the
    // fallback email reads like a sentence. An unknown slug simply drops out.
    prefill.listingSlug ? getListingBySlug(prefill.listingSlug) : Promise.resolve(null),
    getFeaturedListings(6),
  ]);

  // A photograph of somewhere you would be, from the photo-tour room tags --
  // never a listing cover, which is always an interior.
  const heroId = pickPhotoIdByRoom(listings, HERO_ROOMS);
  const [hero] = heroId ? await getMediaByIds([heroId]) : [];

  return (
    <article className="concierge">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Concierge", path: "/concierge" },
        ])}
      />

      <header className="concierge__hero">
        {hero && (
          <Image
            className="concierge__hero-photo"
            src={mediaPublicUrl(hero.storage_path)}
            fill
            sizes="(max-width: 1148px) calc(100vw - 48px), 1100px"
            loading="eager"
            alt=""
            aria-hidden="true"
          />
        )}
        <div className="concierge__hero-text">
          <p className="concierge__eyebrow" {...edit("concierge.eyebrow", "Eyebrow")}>{text("concierge.eyebrow")}</p>
          <h1 {...edit("concierge.title", "Page heading")}>{text("concierge.title")}</h1>
          <p className="concierge__lead" {...edit("concierge.lead", "Opening line")}>
            {text("concierge.lead")}
          </p>
        </div>
      </header>

      {/*
        Three facts about how this works, written as facts.
        Before this they were three equal centred phrases in three bordered
        cells, which is the shape of a segmented control -- so the eye read
        them as tabs and tried to press one. A statement with a sentence under
        it cannot be mistaken for a control, and it also says more.
      */}
      <section className="concierge__reassurance" aria-label="How concierge planning works">
        <p className="concierge__reassurance-item">
          <strong>Local people we know</strong>
          <span>
            Drivers, chefs and guides we have used ourselves on this coast. Not a directory.
          </span>
        </p>
        <p className="concierge__reassurance-item">
          <strong>One request, one point of contact</strong>
          <span>
            You write once. The same person answers until everything is arranged.
          </span>
        </p>
        <p className="concierge__reassurance-item">
          <strong>Clear options before anything is booked</strong>
          <span>
            We come back with what is available and what it costs. Nothing is confirmed until
            you say so.
          </span>
        </p>
      </section>

      <section className="concierge__request" id="request">
        <div className="concierge__request-intro">
          <h2 className="concierge__section-title">
            {listing ? `What should we arrange for ${listing.title}?` : "Start with what you need"}
          </h2>
          <p>
            Choose a service, then share only the details you know. Prefer to write instead?{" "}
            <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.
          </p>
        </div>
        <ConciergeForm
          listingSlug={prefill.listingSlug}
          listingTitle={listing?.title}
          initialCheckIn={prefill.checkIn}
          initialCheckOut={prefill.checkOut}
          initialServices={prefill.services}
          fallbackEmail={BUSINESS.email}
        />
      </section>
    </article>
  );
}
