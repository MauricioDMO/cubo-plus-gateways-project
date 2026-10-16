import { SkipLink } from "../atoms/skip-link";
import { SiteHeader } from "../organisms/site-header";
import { Hero } from "../organisms/hero";
import { PropertySection } from "../organisms/property-section";
import { TestimonialSection } from "../organisms/testimonial-section";
import { Introduction, CategorySection, BookingSteps, JournalSection, ClosingSection, SiteFooter } from "../organisms/content-sections";

export function LandingPage() {
  return (
    <>
      <SkipLink />
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
