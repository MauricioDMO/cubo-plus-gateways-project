import { Mail, MapPin, Phone } from "lucide-react";

import { BUSINESS, formattedAddress, telHref } from "@/modules/site/business";

/*
 * The NAP block on the contact page.
 *
 * The contact page is the one page a local business is expected to state
 * plainly where it is and how to reach it, and it is the page Google most
 * often reads to reconcile a site against a Business Profile. This one said
 * only "Email: ..." in a paragraph of prose.
 *
 * Each row renders only if modules/site/business.ts knows the value, so the phone and
 * street appear the moment they are supplied and nothing is invented in the
 * meantime.
 */
export default function ContactDetails() {
  const tel = telHref();

  return (
    <aside className="contact-details" aria-label="Contact details">
      <h2>Getaways El Salvador</h2>

      <ul>
        <li>
          <MapPin size={17} aria-hidden="true" />
          <span>{formattedAddress()}</span>
        </li>

        {tel && (
          <li>
            <Phone size={17} aria-hidden="true" />
            {/* A tel: link, because most of this traffic is a phone. */}
            <a href={tel}>{BUSINESS.telephone}</a>
          </li>
        )}

        <li>
          <Mail size={17} aria-hidden="true" />
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
        </li>
      </ul>

      <p className="contact-details__area">
        We rent in {BUSINESS.serviceArea.map((area) => area.split(",")[0]?.trim()).join(", ")}.
      </p>
    </aside>
  );
}
