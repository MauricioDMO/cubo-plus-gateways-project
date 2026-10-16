import Link from "next/link";
import { contact } from "@/content/contact";
import { articles, categories, SITE_URL } from "@/content/landing";
import Palm from "../getaways/palm";
import Logo from "../getaways/logo";
import { Icon, type IconName } from "../atoms/icon";
import { ButtonLink } from "../atoms/button-link";
import { PageContainer } from "../atoms/page-container";
import { SectionHeading } from "../molecules/section-heading";
import { CategoryCard } from "../molecules/category-card";
import { ArticleCard } from "../molecules/article-card";

export function Introduction() {
  return (
    <section id="discover" aria-labelledby="intro-title">
      <PageContainer>
        <div className="flex items-center gap-[30px] border-b border-divider py-[65px] max-[600px]:items-start max-[600px]:gap-[18px] max-[600px]:py-10">
          <div className="h-20 w-[70px] shrink-0 max-[600px]:mt-[17px] max-[600px]:h-[52px] max-[600px]:w-[42px]"><Palm className="size-full text-icon-muted" aria-hidden="true" /></div>
          <div><p className="mb-3 text-[9px] leading-[1.6] font-semibold tracking-[2px] text-ink-muted max-[600px]:mb-2.5 max-[600px]:text-[7px] max-[600px]:tracking-[1.3px]">THIS IS YOUR KIND OF GETAWAY</p><h2 className="font-display text-[clamp(19px,2vw,25px)] leading-[1.6] font-medium tracking-[-.6px] text-ink-strong max-[600px]:text-lg max-[600px]:leading-[1.65] max-[600px]:tracking-[-.45px]" id="intro-title">High-end apartment rentals in El Zonte,<br className="max-[600px]:hidden" /> selected for <span className="text-ink-body">quality, comfort, and setting.</span></h2></div>
          <div className="ml-auto flex items-center gap-3.5 border-l border-divider pl-8 text-[11px] whitespace-nowrap text-ink-body max-[1150px]:hidden"><Icon className="size-8 text-icon-muted" name="wave" /><span>Coastal stays.<br />Local soul.</span></div>
        </div>
      </PageContainer>
    </section>
  );
}

export function CategorySection() {
  return (
    <section className="pt-[68px] pb-[90px] max-[850px]:py-[65px] max-[600px]:py-[50px]" aria-label="Explore accommodation categories">
      <PageContainer>
      <SectionHeading eyebrow="FIND YOUR COASTAL CORNER" title="Your stay. Your way." description="A home for every kind of escape." />
      <div className="grid grid-cols-[1.25fr_1fr] gap-6 max-[850px]:grid-cols-2 max-[850px]:gap-[18px] max-[600px]:grid-cols-1 max-[600px]:gap-4">{categories.map((category) => <CategoryCard key={category.title} category={category} />)}</div>
      </PageContainer>
    </section>
  );
}

const steps: { title: string; description: string; icon: IconName; href: string }[] = [
  { title: "Find your place", description: "Explore our handpicked apartments and villas. Find the setting that feels like you.", icon: "home", href: "#properties" },
  { title: "Get to know your stay", description: "Take a look around, explore the details, and hear from the guests who came before you.", icon: "chat", href: "#guest-stories" },
  { title: "Make it a getaway", description: "Book your stay or let our local concierge help bring your El Salvador trip together.", icon: "calendar", href: "/contact-us" },
];

export function BookingSteps() {
  return (
    <section className="border-y border-divider bg-coastal/5 pt-16 pb-[70px] max-[600px]:py-[45px]" aria-labelledby="booking-title">
      <PageContainer>
        <div className="text-center max-[600px]:text-left"><p className="mb-3 text-[10px] leading-[1.6] font-semibold tracking-[2px] text-ink-muted max-[600px]:text-[8px] max-[600px]:tracking-[1.7px]">LESS PLANNING. MORE LIVING.</p><h2 className="font-display text-[29px] leading-[1.25] font-medium tracking-[-1px] text-ink-strong max-[600px]:max-w-[300px] max-[600px]:text-[27px]" id="booking-title">A few steps from your next escape.</h2></div>
        <ol className="mt-9 grid list-none grid-cols-3 gap-5 p-0 max-[1150px]:gap-3.5 max-[850px]:gap-3 max-[600px]:mt-6 max-[600px]:grid-cols-1">{steps.map((step, index) => <li className="min-h-[188px] rounded-feature border border-divider bg-surface-white px-6 py-[22px] max-[1150px]:px-[18px] max-[1150px]:py-5 max-[600px]:grid max-[600px]:min-h-0 max-[600px]:grid-cols-[1fr_48px] max-[600px]:gap-x-4 max-[600px]:p-[18px]" key={step.title}><div className="mb-6 flex items-center justify-between max-[600px]:col-start-2 max-[600px]:row-span-2 max-[600px]:row-start-1 max-[600px]:mb-0 max-[600px]:flex-col-reverse max-[600px]:justify-end max-[600px]:gap-2.5"><span className="font-display text-[9px] font-semibold tracking-[1.2px] text-ink-muted max-[600px]:text-[8px] max-[600px]:tracking-[.6px]">STEP 0{index + 1}</span><span className="grid size-[51px] place-items-center rounded-feature border border-divider bg-coastal/10 max-[600px]:size-12"><Icon className="size-6" name={step.icon} aria-hidden="true" /></span></div><h3 className="font-display text-[17px] font-medium tracking-[-.4px] text-ink-strong max-[850px]:text-[15px] max-[600px]:text-[17px]"><a className="inline-flex items-center gap-2" href={step.href}>{step.title}<Icon className="size-[13px] shrink-0 max-[850px]:hidden" name="diagonal" aria-hidden="true" /></a></h3><p className="mt-[9px] max-w-[300px] text-xs leading-[1.75] text-ink-body max-[600px]:mt-1.5 max-[600px]:max-w-none">{step.description}</p></li>)}</ol>
      </PageContainer>
    </section>
  );
}

export function JournalSection() {
  return (
    <section className="py-[90px] max-[850px]:py-[65px] max-[600px]:py-[50px]" id="journal" aria-label="From the Getaways journal">
      <PageContainer>
      <SectionHeading eyebrow="A LITTLE LOCAL KNOWLEDGE" title="More than a place to stay." description="Surf spots, hidden corners, and stories from El Salvador."><a className="group inline-flex items-center gap-[17px] py-2 text-xs font-medium whitespace-nowrap" href={`${SITE_URL}/blog/`}>Explore the journal<Icon className="transition-transform motion-reduce:transition-none duration-200 group-hover:translate-x-1" name="arrow" /></a></SectionHeading>
      <div className="grid grid-cols-3 gap-7 max-[850px]:gap-[18px] max-[600px]:grid-cols-1 max-[600px]:gap-[30px]">{articles.map((article) => <ArticleCard key={article.title} article={article} />)}</div>
      </PageContainer>
    </section>
  );
}

export function ClosingSection() {
  return (
    <section className="mb-[90px] max-[850px]:mb-[65px] max-[600px]:mb-[50px]" aria-label="Plan a stay or become a host">
      <PageContainer>
      <div className="grid grid-cols-[1.35fr_1fr] gap-6 max-[850px]:grid-cols-[1.1fr_1fr] max-[850px]:gap-[18px] max-[600px]:grid-cols-1 max-[600px]:gap-4">
        <div className="relative isolate overflow-hidden rounded-feature bg-coastal/10 p-[50px] max-[850px]:px-7 max-[850px]:py-[35px] max-[600px]:px-[30px] max-[600px]:py-9"><p className="text-[9px] leading-[1.6] font-semibold tracking-[2px] text-ink-muted">THE COAST IS CALLING</p><h2 className="mt-[17px] mb-[27px] font-display text-[43px] leading-[1.25] font-medium tracking-[-1.8px] text-ink-strong max-[850px]:text-[35px] max-[600px]:text-[38px]">Let’s find your<br />next getaway.</h2><ButtonLink href="/contact-us">Plan your stay</ButtonLink><Palm className="absolute -right-[25px] -bottom-9 -z-10 h-[290px] w-[270px] -rotate-12 text-coastal/15 max-[850px]:-right-[60px] max-[850px]:w-[200px] max-[850px]:opacity-70 max-[600px]:-right-5 max-[600px]:w-[235px] max-[600px]:opacity-100" aria-hidden="true" /></div>
        <div className="flex flex-col items-start rounded-feature border border-divider px-[35px] py-8 max-[850px]:p-7 max-[600px]:p-[30px]"><span className="mb-[15px] grid size-[37px] place-items-center rounded-card bg-coastal/10"><Icon name="key" /></span><p className="text-[8px] leading-[1.6] font-semibold tracking-[2px] text-ink-muted">FOR PROPERTY OWNERS</p><h3 className="mt-2.5 font-display text-2xl leading-[1.4] font-medium tracking-[-.9px] text-ink-strong max-[850px]:text-[21px] max-[600px]:text-[26px]">Your place.<br />Someone’s perfect escape.</h3><p className="mt-3 mb-2.5 max-w-[300px] text-xs text-ink-body max-[600px]:text-[13px]">Property & rental management in El Salvador. Let’s make your property a Getaway.</p><a className="group mt-auto inline-flex items-center gap-[17px] py-2 text-xs font-medium whitespace-nowrap max-[600px]:mt-2.5" href={`${SITE_URL}/submit-listing/`}>Become a host<Icon className="transition-transform motion-reduce:transition-none duration-200 group-hover:translate-x-1" name="arrow" /></a></div>
      </div>
      </PageContainer>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-divider">
      <PageContainer>
      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-[45px] pt-[55px] pb-[46px] max-[850px]:grid-cols-[1.3fr_1fr_1fr] max-[850px]:gap-6 max-[600px]:grid-cols-2 max-[600px]:gap-x-5 max-[600px]:gap-y-[35px] max-[600px]:pt-10 max-[600px]:pb-8">
        <div className="max-[600px]:col-span-full">
          <Link className="inline-block w-[190px] text-coastal hover:text-ink-strong max-[600px]:w-[195px]" href="/" aria-label="Getaways El Salvador home"><Logo className="block h-auto w-full" aria-hidden="true" /></Link>
          <p className="my-4 text-[11px] leading-[1.9] text-ink-body">Property & Rental Management<br />in El Salvador.</p>
          <Link className="mt-[9px] flex items-center gap-[7px] text-[11px] text-ink-body hover:text-ink-strong max-[600px]:min-h-[30px] max-[600px]:text-xs" href="/contact-us"><Icon className="size-3" name="pin" />{contact.location}</Link>
          <a className="mt-[9px] flex items-center gap-[7px] text-[11px] text-ink-body hover:text-ink-strong max-[600px]:min-h-[30px] max-[600px]:text-xs" href={contact.phoneHref}><Icon className="size-3" name="phone" />{contact.phone}</a>
        </div>
        <div><h3 className="mt-0.5 mb-[22px] font-sans text-xs font-medium max-[600px]:mb-[18px]">Find your stay</h3><a className="mt-[9px] flex items-center gap-[7px] text-[11px] text-ink-body hover:text-ink-strong max-[600px]:min-h-[30px] max-[600px]:text-xs" href={`${SITE_URL}/properties/`}>All properties</a><a className="mt-[9px] flex items-center gap-[7px] text-[11px] text-ink-body hover:text-ink-strong max-[600px]:min-h-[30px] max-[600px]:text-xs" href={categories[0].href}>Apartments</a><a className="mt-[9px] flex items-center gap-[7px] text-[11px] text-ink-body hover:text-ink-strong max-[600px]:min-h-[30px] max-[600px]:text-xs" href={categories[1].href}>Villas</a><a className="mt-[9px] flex items-center gap-[7px] text-[11px] text-ink-body hover:text-ink-strong max-[600px]:min-h-[30px] max-[600px]:text-xs" href={`${SITE_URL}/submit-listing/`}>List a property</a></div>
        <div><h3 className="mt-0.5 mb-[22px] font-sans text-xs font-medium max-[600px]:mb-[18px]">Get to know us</h3><Link className="mt-[9px] flex items-center gap-[7px] text-[11px] text-ink-body hover:text-ink-strong max-[600px]:min-h-[30px] max-[600px]:text-xs" href="/about">About Getaways</Link><Link className="mt-[9px] flex items-center gap-[7px] text-[11px] text-ink-body hover:text-ink-strong max-[600px]:min-h-[30px] max-[600px]:text-xs" href="/#journal">The journal</Link><Link className="mt-[9px] flex items-center gap-[7px] text-[11px] text-ink-body hover:text-ink-strong max-[600px]:min-h-[30px] max-[600px]:text-xs" href="/contact-us">Contact us</Link><a className="mt-[9px] flex items-center gap-[7px] text-[11px] text-ink-body hover:text-ink-strong max-[600px]:min-h-[30px] max-[600px]:text-xs" href={`${SITE_URL}/account/login/`}>Sign in</a></div>
        <div className="max-[850px]:col-span-2 max-[850px]:col-start-2 max-[600px]:col-span-full max-[600px]:col-start-1 max-[600px]:flex max-[600px]:flex-wrap max-[600px]:gap-x-5"><h3 className="mt-0.5 mb-[22px] font-sans text-xs font-medium max-[600px]:m-0 max-[600px]:w-full">A little inspiration</h3><a className="mt-[9px] flex items-center gap-[7px] text-[11px] text-ink-body hover:text-ink-strong max-[600px]:min-h-[30px] max-[600px]:text-xs" href="https://www.instagram.com/getawayselsalvador/">Instagram<Icon className="size-3" name="diagonal" /></a><a className="mt-[9px] flex items-center gap-[7px] text-[11px] text-ink-body hover:text-ink-strong max-[600px]:min-h-[30px] max-[600px]:text-xs" href="https://x.com/getaways_sv">X / Twitter<Icon className="size-3" name="diagonal" /></a><p className="mt-6 text-[11px] text-ink-body max-[600px]:mt-[18px] max-[600px]:w-full">See you by the ocean.</p><Icon className="mt-3 w-[30px] text-icon-muted max-[600px]:hidden" name="wave" /></div>
      </div>
      <div className="flex items-center justify-between gap-5 border-t border-divider py-[21px] text-[9px] text-ink-body max-[600px]:flex-wrap max-[600px]:gap-2 max-[600px]:text-[8px]"><p>© 2026 Getaways El Salvador.</p><span className="max-[600px]:hidden">Handpicked stays. Local soul.</span><a className="inline-flex items-center gap-2.5" href="#home">Back to top<Icon className="size-3 -rotate-90" name="arrow" /></a></div>
      </PageContainer>
    </footer>
  );
}
