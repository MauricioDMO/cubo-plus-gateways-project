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
    <article className="about-page">
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "About Us", path: "/about" }])} />

      <section
        className="about-hero"
        {...c.edit("about.hero.image", "Hero photo", "image", { pairSlot: "about.hero.imageMobile", pairLabel: "Phone photo" })}
      >
        {heroDesktop && (
          <picture>
            {/* A portrait version for phones, where the landscape group photo
                would lose people off both sides. Same 640px breakpoint as the
                mobile rules in globals.css. */}
            {heroMobile && <source media="(max-width: 640px)" srcSet={heroMobile.url} />}
            <img
              src={heroDesktop.url}
              alt=""
              {...c.focus("about.hero.image@focus", "about.hero.imageMobile@focus", { className: "about-hero__photo" })}
            />
          </picture>
        )}
        <div className="about-hero__content">
          <p {...c.edit("about.hero.eyebrow", "Eyebrow", "text", { className: "about-eyebrow about-eyebrow--on-photo" })}>
            {c.text("about.hero.eyebrow")}
          </p>
          <h1 {...c.edit("about.hero.title", "Headline")}>{c.text("about.hero.title")}</h1>
          <p {...c.edit("about.hero.subtitle", "Subheadline", "text", { className: "about-hero__subtitle" })}>
            {c.text("about.hero.subtitle")}
          </p>
        </div>
      </section>

      <section className="about-story">
        <p {...c.edit("about.story.eyebrow", "Section label", "text", { className: "about-eyebrow about-eyebrow--dot" })}>
          {c.text("about.story.eyebrow")}
        </p>
        <h2 {...c.edit("about.story.title", "Heading")}>{c.text("about.story.title")}</h2>
        <div {...c.edit("about.story.body", "Story", "richtext")} dangerouslySetInnerHTML={{ __html: c.rich("about.story.body") }} />
      </section>

      <div className="about-marquee" aria-hidden="true">
        <div className="about-marquee__track">
          {marqueeRun.map((item, index) => (
            <span className="about-marquee__item" key={`${item.id}-${index}`}>
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
          {...c.focus("about.story.image@focus", "about.story.image@focusMobile", { className: "about-photo" })}
          {...c.edit("about.story.image", "Large photo", "image")}
        />
      )}

      <section className="about-quote-text">
        <blockquote>
          &ldquo;<span {...c.edit("about.quote.text", "Quote")}>{c.text("about.quote.text")}</span>&rdquo;
        </blockquote>
        <div {...c.edit("about.quote.body", "Paragraph", "richtext")} dangerouslySetInnerHTML={{ __html: c.rich("about.quote.body") }} />
        <p {...c.edit("about.quote.closing", "Closing line", "text", { className: "about-quote-text__closing" })}>
          {c.text("about.quote.closing")}
        </p>
      </section>

      <section className="about-team">
        <p {...c.edit("about.team.eyebrow", "Section label", "text", { className: "about-eyebrow about-eyebrow--dot" })}>
          {c.text("about.team.eyebrow")}
        </p>
        <h2 {...c.edit("about.team.title", "Heading")}>{c.text("about.team.title")}</h2>
        <p {...c.edit("about.team.intro", "Intro", "text", { className: "about-team__intro" })}>
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
