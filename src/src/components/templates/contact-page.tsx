import { SkipLink } from "../atoms/skip-link";
import { ContactSection } from "../organisms/contact-section";
import { SiteFooter } from "../organisms/content-sections";
import { SiteHeader } from "../organisms/site-header";

export function ContactPage() {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main-content">
        <ContactSection />
      </main>
      <SiteFooter />
    </>
  );
}
