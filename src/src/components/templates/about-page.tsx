import { SkipLink } from "../atoms/skip-link";
import { AboutHero, AboutStory } from "../organisms/about-sections";
import { ClosingSection, SiteFooter } from "../organisms/content-sections";
import { SiteHeader } from "../organisms/site-header";

export function AboutPage() {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main-content">
        <AboutHero />
        <AboutStory />
        <ClosingSection />
      </main>
      <SiteFooter />
    </>
  );
}
