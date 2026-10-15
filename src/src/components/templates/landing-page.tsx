import { SiteHeader } from "../organisms/site-header";
import { Hero } from "../organisms/hero";
import { PropertySection } from "../organisms/property-section";
import { TestimonialSection } from "../organisms/testimonial-section";
import { Introduction, CategorySection, BookingSteps, JournalSection, ClosingSection, SiteFooter } from "../organisms/content-sections";

export function LandingPage() {
  return (
    <>
      <a className="absolute top-3 left-5 z-20 -translate-y-[200%] rounded-lg bg-surface-white px-5 py-3 text-ink-strong focus:translate-y-0" href="#main-content">Skip to content</a>
      <SiteHeader />
      <main id="main-content">
        <Hero />
        <Introduction />
        <CategorySection />
        <BookingSteps />
        <PropertySection />
        <div id="guest-stories"><TestimonialSection /></div>
        <JournalSection />
        <ClosingSection />
      </main>
      <SiteFooter />
    </>
  );
}
