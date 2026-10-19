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
    <aside className="mt-7 mb-0 bg-[rgba(15,_23,_39,_0.02)] mx-0 p-5 rounded-[10px] border border-solid border-border" aria-label="Contact details">
      <h2 className="mt-0 mb-3 mx-0 font-heading text-[18px]">Getaways El Salvador</h2>

      <ul className="list-none flex flex-col m-0 p-0 gap-2.25">
        <li className="flex items-start text-[15px] leading-[1.5] gap-2.5">
          <MapPin className="flex-none mt-0.5 text-heading" size={17} aria-hidden="true" />
          <span>{formattedAddress()}</span>
        </li>

        {tel && (
          <li className="flex items-start text-[15px] leading-[1.5] gap-2.5">
            <Phone className="flex-none mt-0.5 text-heading" size={17} aria-hidden="true" />
            {/* A tel: link, because most of this traffic is a phone. */}
            <a className="text-inherit" href={tel}>{BUSINESS.telephone}</a>
          </li>
        )}

        <li className="flex items-start text-[15px] leading-[1.5] gap-2.5">
          <Mail className="flex-none mt-0.5 text-heading" size={17} aria-hidden="true" />
          <a className="text-inherit" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
        </li>
      </ul>

      <p className="mt-3.5 mb-0 text-[14px] text-body-text mx-0">
        We rent in {BUSINESS.serviceArea.map((area) => area.split(",")[0]?.trim()).join(", ")}.
      </p>
    </aside>
  );
}
