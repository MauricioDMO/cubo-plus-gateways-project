import type { Metadata } from "next";
import Image from "next/image";

import AboutTeamGrid from "@/components/organisms/AboutTeamGrid";
import JsonLd from "@/components/seo/JsonLd";
import { siteText } from "@/modules/site/server/site-text";
import { breadcrumbSchema } from "@/shared/seo/structured-data";

/*
 * The about page.
 *
 * A hardcoded route, which takes precedence over the [...segments] catch-all
 * (see app/(site)/concierge/page.tsx for the same reasoning) -- there is a
 * real `pages` row with slug "about" carrying the old WordPress copy, and
 * this route shadows it rather than the other way around. Admin → Pages
 * sends its Edit button here, into edit mode.
 *
 * Content, team photos, colors and type all pulled from the "Getaways About
 * Page Redesign" design, at the account owner's request -- deliberately its
 * own visual system (Montserrat, the cream/charcoal palette) rather than the
 * rest of the site's Inter/Lexend and tokens.
 *
 * Every word, photo and team member is a slot in modules/content/site-content.ts (the
 * about.* groups), edited on the page itself; the defaults there are this
 * page exactly as designed. A team member with a quote reveals it on click
 * (AboutTeamGrid, matching the design's own interaction); one without is
 * not clickable, the same way ListingReviews shows no section at all rather
 * than an empty one.
 */

const TEAM = "about.team.members";
const MARQUEE = "about.marquee";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Getaways El Salvador is a boutique rental and property management team rooted on El Salvador's Pacific coast, in El Zonte.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const c = await siteText({ images: true });
  const heroDesktop = c.image("about.hero.image");
  const heroMobile = c.image("about.hero.imageMobile");
  const storyPhoto = c.image("about.story.image");
  const marquee = c.list(MARQUEE);
  const members = c.list(TEAM);
  // The words twice, back to back, so the scroll loops with no seam.
  const marqueeRun = [...marquee, ...marquee];

  return (
    <article className="flex flex-col bg-[#f7f4f0] text-[#394342] [font-family:var(--font-montserrat),Montserrat,sans-serif] shadow-[0_0_0_100vmax_#f7f4f0] [clip-path:inset(0_-100vmax)]">
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "About Us", path: "/about" }])} />

      <section
        className="relative flex items-end [--hero-h:clamp(600px,_88vh,_1000px)] min-h-[var(--hero-h)] w-[min(100vw,_calc(var(--hero-h)_*_3.2))] mt-0
          mb-16 bg-button-bg overflow-hidden isolate mx-[max(calc(50%_-_50vw),_calc(50%_-_var(--hero-h)_*_1.6))] px-[clamp(24px,_6vw,_72px)]
          py-[clamp(40px,_8vw,_80px)] [&::before]:content-[''] [&::before]:absolute [&::before]:top-0 [&::before]:right-0
          [&::before]:bottom-0 [&::before]:left-0
          [&::before]:[background:linear-gradient(0deg,_rgba(15,_23,_39,_0.75),_rgba(15,_23,_39,_0.1)_55%,_rgba(15,_23,_39,_0.35))]
          [&::before]:z-[-1] [&_h1]:mt-0 [&_h1]:mb-4 [&_h1]:text-[rgb(250,_251,_249)] [&_h1]:text-[clamp(48px,_9vw,_96px)]
          [&_h1]:font-extrabold [&_h1]:leading-[1.05] [&_h1]:uppercase [&_h1]:mx-0 [&_h1]:max-[640.001px]:normal-case
          [&_h1]:max-[640.001px]:text-[clamp(26px,_7.5vw,_34px)] [&_h1]:max-[640.001px]:mb-1.5
          max-[640.001px]:min-h-[clamp(300px,_max(42vh,_100vw),_620px)] max-[640.001px]:pt-[clamp(20px,_5vw,_28px)] max-[640.001px]:pb-4.5
          max-[640.001px]:px-5"
        {...c.edit("about.hero.image", "Hero photo", "image", { pairSlot: "about.hero.imageMobile", pairLabel: "Phone photo" })}
      >
        {heroDesktop && (
          <picture>
            {/* A portrait version for phones, where the landscape group photo
                would lose people off both sides. Same 640px breakpoint as the
                mobile Tailwind variants below. */}
            {heroMobile && <source media="(max-width: 640px)" srcSet={heroMobile.url} />}
            <img
              src={heroDesktop.url}
              alt=""
              {...c.focus("about.hero.image@focus", "about.hero.imageMobile@focus", { className: `absolute top-0 right-0 bottom-0 left-0 z-[-2] w-full h-full object-cover object-[center_32%] [transform:scale(1.12)]
                max-[640.001px]:object-[center_100%] max-[640.001px]:[transform:none]` })}
            />
          </picture>
        )}
        <div className="max-w-275">
          <p {...c.edit("about.hero.eyebrow", "Eyebrow", "text", { className: `inline-block mt-0 mb-3 text-[#394342] text-[13px] font-bold tracking-[0.2em] leading-none uppercase mx-0
            max-[640.001px]:text-[11px] max-[640.001px]:tracking-[0.06em] [&&]:text-[rgba(255,_255,_255,_0.92)] [&&]:font-semibold
            [&&]:tracking-[0.22em] [&&]:max-[640.001px]:tracking-[0.06em]` })}>
            {c.text("about.hero.eyebrow")}
          </p>
          <h1 {...c.edit("about.hero.title", "Headline")}>{c.text("about.hero.title")}</h1>
          <p {...c.edit("about.hero.subtitle", "Subheadline", "text", { className: "max-w-120 text-[rgba(250,_251,_249,_0.85)] text-[18px] font-light leading-[1.5] text-justify max-[640.001px]:text-left max-[640.001px]:text-[13px] max-[640.001px]:leading-[1.35]" })}>
            {c.text("about.hero.subtitle")}
          </p>
        </div>
      </section>

      <section className="max-w-180 mt-0 mb-14 text-center mx-auto [&_h2]:mt-0 [&_h2]:mb-5 [&_h2]:text-[#394342] [&_h2]:text-[clamp(32px,_5vw,_51px)]
        [&_h2]:font-extrabold [&_h2]:leading-[1.1] [&_h2]:mx-0 [&_p]:mt-0 [&_p]:mb-4 [&_p]:text-[16px] [&_p]:font-light
        [&_p]:leading-[30px] [&_p]:text-justify [&_p]:mx-0 [&_p:last-child]:mb-0">
        <p {...c.edit("about.story.eyebrow", "Section label", "text", { className: `inline-block mt-0 mb-3 text-[#394342] text-[13px] font-bold tracking-[0.2em] leading-none uppercase mx-0
          max-[640.001px]:text-[11px] max-[640.001px]:tracking-[0.06em] [&&]:relative [&&]:pl-4 [&::before]:content-['']
          [&::before]:absolute [&::before]:left-0 [&::before]:top-0.75 [&::before]:w-1.75 [&::before]:h-1.75
          [&::before]:bg-[#c8b89a]` })}>
          {c.text("about.story.eyebrow")}
        </p>
        <h2 {...c.edit("about.story.title", "Heading")}>{c.text("about.story.title")}</h2>
        <div {...c.edit("about.story.body", "Story", "richtext")} dangerouslySetInnerHTML={{ __html: c.rich("about.story.body") }} />
      </section>

      <div className="w-[100vw] mt-0 mb-14 overflow-hidden bg-button-bg [transform:rotate(-1.1deg)] mx-[calc(50%_-_50vw)] px-0 py-5.5" aria-hidden="true">
        <div className="flex w-[max-content] [animation:about-marquee-scroll_32s_linear_infinite]">
          {marqueeRun.map((item, index) => (
            <span className="shrink-0 text-[rgba(250,_251,_249,_0.85)] text-[clamp(19px,_3.2vw,_35px)] font-extrabold tracking-[0.02em] uppercase
              whitespace-nowrap [&::after]:content-['•'] [&::after]:ml-8 [&::after]:text-[#c8b89a] [&::after]:max-[640.001px]:ml-3.5" key={`${item.id}-${index}`}>
              <span>{item.text}</span>
            </span>
          ))}
        </div>
      </div>

      {storyPhoto && (
        <Image
          src={storyPhoto.url}
          width={1600}
          height={900}
          sizes="100vw"
          alt=""
          loading="lazy"
          {...c.focus("about.story.image@focus", "about.story.image@focusMobile", { className: "block w-[100vw] max-w-none h-[clamp(320px,_55vh,_620px)] mt-0 mb-14 object-cover mx-[calc(50%_-_50vw)]" })}
          {...c.edit("about.story.image", "Large photo", "image")}
        />
      )}

      <section className="max-w-160 mt-0 mb-14 text-center mx-auto [&_blockquote]:mt-0 [&_blockquote]:mb-5 [&_blockquote]:text-[#394342]
        [&_blockquote]:text-[clamp(24px,_3.4vw,_34px)] [&_blockquote]:font-semibold [&_blockquote]:not-italic [&_blockquote]:leading-[1.4]
        [&_blockquote]:mx-0 [&_p]:mt-0 [&_p]:mb-3 [&_p]:text-[16px] [&_p]:font-light [&_p]:leading-[28px] [&_p]:text-justify [&_p]:mx-0">
        <blockquote>
          &ldquo;<span {...c.edit("about.quote.text", "Quote")}>{c.text("about.quote.text")}</span>&rdquo;
        </blockquote>
        <div {...c.edit("about.quote.body", "Paragraph", "richtext")} dangerouslySetInnerHTML={{ __html: c.rich("about.quote.body") }} />
        <p {...c.edit("about.quote.closing", "Closing line", "text", { className: "mt-5! text-[#394342]! font-extrabold text-center!" })}>
          {c.text("about.quote.closing")}
        </p>
      </section>

      <section className="w-[100vw] pt-[clamp(56px,_10vh,_120px)] pb-[clamp(48px,_8vh,_100px)] bg-white text-center mx-[calc(50%_-_50vw)] my-0
        px-[clamp(24px,_8vw,_220px)] [&_h2]:mt-0 [&_h2]:mb-5 [&_h2]:text-[#394342] [&_h2]:text-[clamp(32px,_5vw,_51px)]
        [&_h2]:font-extrabold [&_h2]:leading-[1.1] [&_h2]:mx-0">
        <p {...c.edit("about.team.eyebrow", "Section label", "text", { className: `inline-block mt-0 mb-3 text-[#394342] text-[13px] font-bold tracking-[0.2em] leading-none uppercase mx-0
          max-[640.001px]:text-[11px] max-[640.001px]:tracking-[0.06em] [&&]:relative [&&]:pl-4 [&::before]:content-['']
          [&::before]:absolute [&::before]:left-0 [&::before]:top-0.75 [&::before]:w-1.75 [&::before]:h-1.75
          [&::before]:bg-[#c8b89a]` })}>
          {c.text("about.team.eyebrow")}
        </p>
        <h2 {...c.edit("about.team.title", "Heading")}>{c.text("about.team.title")}</h2>
        <p {...c.edit("about.team.intro", "Intro", "text", { className: "max-w-160 mt-0 mb-10 text-[16px] font-light leading-[28px] text-justify mx-auto" })}>
          {c.text("about.team.intro")}
        </p>

        <AboutTeamGrid

          members={members.map((member) => ({
            key: member.id,
            name: member.name,
            role: member.role,
            quote: member.quote || undefined,
            photoUrl: c.media(member.photo)?.url,
            photoFocus: member.photoFocus || undefined,
          }))}
        />
      </section>
    </article>
  );
}
