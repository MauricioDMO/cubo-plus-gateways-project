import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Getaways El Salvador | Coastal Stays & Local Concierge",
  description:
    "Handpicked apartment and villa rentals in El Zonte, El Salvador. Oceanfront stays, prime surf-town locations, and a concierge team to plan your trip.",
  openGraph: {
    title: "Getaways El Salvador | Your coastal getaway",
    description: "Handpicked stays. Local knowledge. Your El Salvador getaway, taken care of.",
    images: [{ url: "https://getawayselsalvador.com/wp-content/uploads/2026/01/cropped-DJI_0151.jpg", alt: "The Pacific coastline in El Salvador" }],
    type: "website",
  },
  icons: { icon: "/getaways/logo.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${lexend.variable} scroll-smooth scroll-pt-7 motion-reduce:scroll-auto`}
    >
      <body className="bg-page-white font-sans text-sm leading-[1.65] text-ink-body antialiased">{children}</body>
    </html>
  );
}
