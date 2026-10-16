import type { Metadata } from "next";
import { about } from "@/content/about";
import { SITE_URL } from "@/content/landing";
import { AboutPage } from "@/src/components/templates/about-page";

export const metadata: Metadata = {
  title: "About Us | Getaways El Salvador",
  description: about.introduction,
  openGraph: {
    title: "About Us | Getaways El Salvador",
    description: about.introduction,
    type: "website",
    images: [{ url: `${SITE_URL}/wp-content/uploads/2026/03/DSC09155.jpg`, alt: about.imageAlt }],
  },
};

export default function About() {
  return <AboutPage />;
}
