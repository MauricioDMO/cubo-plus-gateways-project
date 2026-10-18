import Header from "@/components/Header";
import Footer from "@/components/Footer";

/*
 * Public site layout: the Header and Footer around every public page.
 * Route groups don't change URLs, so every public path is unchanged.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="site-main">{children}</main>
      <Footer />
    </>
  );
}
