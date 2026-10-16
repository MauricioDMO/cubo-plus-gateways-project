import type { Metadata } from "next";
import { contact } from "@/content/contact";
import { SITE_URL } from "@/content/landing";
import { ContactPage } from "@/src/components/templates/contact-page";

export const metadata: Metadata = {
  title: "Contact Us | Getaways El Salvador",
  description: contact.introduction,
  openGraph: {
    title: "Contact Us | Getaways El Salvador",
    description: contact.introduction,
    type: "website",
    images: [{ url: `${SITE_URL}/wp-content/uploads/2026/01/cropped-DJI_0151.jpg`, alt: "The Pacific coastline in El Salvador" }],
  },
};

export default function Contact() {
  return <ContactPage />;
}
