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
    <aside className="mt-7 mb-0 bg-[rgba(15,_23,_39,_0.02)] mx-0 p-5 rounded-[10px] border border-solid border-border [&_h2]:mt-0 [&_h2]:mb-3
      [&_h2]:font-heading [&_h2]:text-[18px] [&_h2]:mx-0 [&_ul]:list-none [&_ul]:flex [&_ul]:flex-col [&_ul]:m-0 [&_ul]:p-0
      [&_ul]:gap-2.25 [&_li]:flex [&_li]:items-start [&_li]:text-[15px] [&_li]:leading-[1.5] [&_li]:gap-2.5 [&_li_svg]:flex-none
      [&_li_svg]:mt-0.5 [&_li_svg]:text-heading [&_a]:text-inherit" aria-label="Contact details">
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

      <p className="mt-3.5 mb-0 text-[14px] text-body-text mx-0">
        We rent in {BUSINESS.serviceArea.map((area) => area.split(",")[0]?.trim()).join(", ")}.
      </p>
    </aside>
  );
}
