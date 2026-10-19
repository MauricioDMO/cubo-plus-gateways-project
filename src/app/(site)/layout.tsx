import Header from "@/components/organisms/Header";
import Footer from "@/components/organisms/Footer";

/*
 * Public site layout: the Header and Footer around every public page.
 * Route groups don't change URLs, so every public path is unchanged.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 w-full max-w-301 mx-auto my-0 px-6 py-10">{children}</main>
      <Footer />
    </>
  );
}
