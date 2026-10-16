import Image from "next/image";
import { about } from "@/content/about";
import { ButtonLink } from "../atoms/button-link";
import { Icon } from "../atoms/icon";
import { PageContainer } from "../atoms/page-container";
import { SectionHeading } from "../molecules/section-heading";
import Palm from "../getaways/palm";

export function AboutHero() {
  return (
    <section className="pt-9 pb-20 max-[850px]:pt-6 max-[600px]:pt-5 max-[600px]:pb-12" aria-labelledby="about-title">
      <PageContainer>
        <div className="grid grid-cols-[.9fr_1.1fr] items-center gap-16 max-[1150px]:gap-10 max-[850px]:grid-cols-1 max-[850px]:gap-9">
          <div>
            <p className="mb-5 flex items-center gap-3 text-[10px] font-semibold tracking-[2px] text-ink-muted"><span className="h-px w-6 bg-coastal" />GETAWAYS EL SALVADOR</p>
            <h1 className="font-display text-[clamp(64px,7vw,88px)] leading-[1.1] font-medium tracking-[-4px] text-ink-strong max-[600px]:text-[60px] max-[600px]:tracking-[-3px]" id="about-title">{about.title}<span className="text-icon-muted">.</span></h1>
            <p className="mt-7 max-w-[460px] text-xl leading-[1.8] text-ink-body max-[600px]:mt-5 max-[600px]:text-base">{about.introduction}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
              <ButtonLink href="/contact-us">Get in touch</ButtonLink>
              <a className="inline-flex min-h-11 items-center gap-2 border-b border-divider text-xs text-ink-strong" href="#our-story">Our story<Icon name="arrow" className="size-3.5 rotate-90" /></a>
            </div>
          </div>
          <figure>
            <div className="relative aspect-[1.08] overflow-hidden rounded-feature bg-coastal/5 max-[850px]:aspect-[1.4]">
              <Image src={about.image} alt={about.imageAlt} fill sizes="(max-width: 850px) calc(100vw - 40px), (max-width: 1204px) 52vw, 592px" className="object-cover" preload />
            </div>
            <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] text-ink-body">
              <span>The people behind your getaway.</span>
              <span className="inline-flex items-center gap-1.5"><Icon name="pin" className="size-3" />El Zonte, El Salvador</span>
            </figcaption>
          </figure>
        </div>
      </PageContainer>
    </section>
  );
}

export function AboutStory() {
  return (
    <section className="pb-20 max-[600px]:pb-12" id="our-story" aria-label="Our story">
      <PageContainer>
        <div className="grid grid-cols-[.9fr_1.1fr] gap-16 border-t border-divider pt-16 max-[1150px]:gap-10 max-[850px]:grid-cols-1 max-[850px]:gap-2 max-[600px]:pt-10">
          <SectionHeading eyebrow="OUR STORY" title="Real estate expertise. Strong local roots." />
          <div className="space-y-6 text-base leading-[1.9] max-[600px]:text-sm">
            <p>{about.history}</p>
            <p>{about.service}</p>
          </div>
        </div>
        <div className="relative isolate mt-14 overflow-hidden rounded-feature bg-coastal px-12 py-11 text-inverse max-[600px]:mt-9 max-[600px]:px-7 max-[600px]:py-8">
          <Palm className="absolute -right-8 -bottom-14 -z-10 h-[300px] w-[260px] -rotate-12 text-inverse/10" aria-hidden="true" />
          <p className="max-w-[800px] font-display text-[25px] leading-[1.6] font-medium tracking-[-.6px] max-[600px]:text-xl">{about.approach}</p>
          <p className="mt-5 text-sm text-inverse/85">{about.welcome}</p>
        </div>
      </PageContainer>
    </section>
  );
}
