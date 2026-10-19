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
    <article className="w-[min(100%_-_48px,_1100px)] mt-0 mb-[clamp(56px,_7vw,_92px)] mx-auto
      [@media_(min-width:_641px)_and_(max-width:_760px)]:w-[min(100%_-_28px,_1100px)] max-[640.001px]:w-full">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Concierge", path: "/concierge" },
        ])}
      />

      <header className="relative flex items-end min-h-[clamp(340px,_44vw,_520px)] mt-[clamp(24px,_3vw,_40px)] mb-[clamp(40px,_5vw,_64px)] overflow-hidden
        bg-[#101822] mx-0 p-[clamp(26px,_4vw,_52px)] rounded-[12px] [&::after]:content-[''] [&::after]:absolute [&::after]:top-0
        [&::after]:right-0 [&::after]:bottom-0 [&::after]:left-0
        [&::after]:[background:linear-gradient(180deg,_rgba(9,_14,_22,_0.15)_0%,_rgba(9,_14,_22,_0.72)_100%)]">
        {hero && (
          <Image
            className="absolute top-0 right-0 bottom-0 left-0 w-full h-full object-cover"
            src={mediaPublicUrl(hero.storage_path)}
            fill
            sizes="(max-width: 1148px) calc(100vw - 48px), 1100px"
            loading="eager"
            alt=""
            aria-hidden="true"
          />
        )}
        <div className="relative z-[1] max-w-[44ch] text-white [&_h1]:mt-0 [&_h1]:mb-3.5 [&_h1]:text-[clamp(30px,_4.2vw,_50px)] [&_h1]:leading-[1.08]
          [&_h1]:text-white [&_h1]:mx-0">
          <p className="mt-0 mb-3 text-[11px] font-extrabold tracking-[1.4px] uppercase text-[rgba(255,_255,_255,_0.75)] mx-0" {...edit("concierge.eyebrow", "Eyebrow")}>{text("concierge.eyebrow")}</p>
          <h1 {...edit("concierge.title", "Page heading")}>{text("concierge.title")}</h1>
          <p className="text-[clamp(16px,_1.6vw,_18px)] leading-[1.6] text-[rgba(255,_255,_255,_0.88)] m-0" {...edit("concierge.lead", "Opening line")}>
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
      <section className="grid grid-cols-3 mt-0 mb-[clamp(48px,_6vw,_72px)] mx-0 gap-[clamp(26px,_4vw,_52px)] max-[760.001px]:hidden" aria-label="How concierge planning works">
        <p className="grid text-left m-0 gap-1.75 [&::before]:content-[''] [&::before]:block [&::before]:w-6 [&::before]:mb-3.5
          [&::before]:border-t-[2px] [&::before]:border-solid [&::before]:border-t-heading [&_strong]:font-heading [&_strong]:text-[16px]
          [&_strong]:font-medium [&_strong]:leading-[1.35] [&_strong]:text-heading [&_span]:text-[14px] [&_span]:leading-[1.55]
          [&_span]:text-body-text">
          <strong>Local people we know</strong>
          <span>
            Drivers, chefs and guides we have used ourselves on this coast. Not a directory.
          </span>
        </p>
        <p className="grid text-left m-0 gap-1.75 [&::before]:content-[''] [&::before]:block [&::before]:w-6 [&::before]:mb-3.5
          [&::before]:border-t-[2px] [&::before]:border-solid [&::before]:border-t-heading [&_strong]:font-heading [&_strong]:text-[16px]
          [&_strong]:font-medium [&_strong]:leading-[1.35] [&_strong]:text-heading [&_span]:text-[14px] [&_span]:leading-[1.55]
          [&_span]:text-body-text">
          <strong>One request, one point of contact</strong>
          <span>
            You write once. The same person answers until everything is arranged.
          </span>
        </p>
        <p className="grid text-left m-0 gap-1.75 [&::before]:content-[''] [&::before]:block [&::before]:w-6 [&::before]:mb-3.5
          [&::before]:border-t-[2px] [&::before]:border-solid [&::before]:border-t-heading [&_strong]:font-heading [&_strong]:text-[16px]
          [&_strong]:font-medium [&_strong]:leading-[1.35] [&_strong]:text-heading [&_span]:text-[14px] [&_span]:leading-[1.55]
          [&_span]:text-body-text">
          <strong>Clear options before anything is booked</strong>
          <span>
            We come back with what is available and what it costs. Nothing is confirmed until
            you say so.
          </span>
        </p>
      </section>

      <section className="scroll-mt-22.5" id="request">
        <div className="[&_p]:mt-0 [&_p]:mb-6.5 [&_p]:text-body-text [&_p]:mx-0">
          <h2 className="mt-0 mb-5 text-[clamp(24px,_2.6vw,_32px)] leading-[1.2] text-heading mx-0">
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
