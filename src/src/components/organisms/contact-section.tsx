import Image from "next/image";
import { contact } from "@/content/contact";
import { Icon } from "../atoms/icon";
import { PageContainer } from "../atoms/page-container";
import { ContactMethod } from "../molecules/contact-method";
import { ContactForm } from "./contact-form";

export function ContactSection() {
  return (
    <section className="pt-10 pb-20 max-[600px]:pt-6 max-[600px]:pb-12" aria-labelledby="contact-title">
      <PageContainer>
        <div className="grid grid-cols-[.9fr_1.1fr] items-start gap-16 max-[1150px]:gap-10 max-[850px]:grid-cols-1">
          <div className="min-w-0 pt-4 max-[600px]:pt-0">
            <p className="mb-5 flex items-center gap-3 text-[10px] font-semibold tracking-[2px] text-ink-muted"><span className="h-px w-6 bg-coastal" />GETAWAYS EL SALVADOR</p>
            <h1 className="font-display text-[clamp(54px,6vw,76px)] leading-[1.1] font-medium tracking-[-3px] text-ink-strong max-[600px]:text-[52px] max-[600px]:tracking-[-2px]" id="contact-title">{contact.title}<span className="text-icon-muted">.</span></h1>
            <p className="mt-6 text-base leading-[1.9]">{contact.introduction}</p>
            <p className="mt-5 text-sm leading-[1.9]">{contact.invitation}</p>
            <div className="mt-5">
              <ContactMethod label="Call us" value={contact.phone} href={contact.phoneHref} icon="phone" />
              <ContactMethod label="Email us" value={contact.email} href={`mailto:${contact.email}`} icon="mail" />
            </div>
            <p className="mt-6 flex items-center gap-2 text-xs"><Icon name="pin" className="size-4" />{contact.location}</p>
          </div>
          <ContactForm />
        </div>
        <div className="relative isolate mt-16 overflow-hidden rounded-feature bg-coastal px-12 py-14 text-inverse max-[600px]:mt-10 max-[600px]:px-7 max-[600px]:py-10">
          <Image src="/getaways/coast.jpg" alt="Pacific waves along the palm-lined coast of El Salvador" fill sizes="(max-width: 1204px) 100vw, 1140px" className="-z-20 object-cover object-[50%_60%]" />
          <div className="absolute inset-0 -z-10 bg-coastal/70" />
          <Icon name="wave" className="mb-5 h-6 w-10 text-inverse/80" />
          <p className="max-w-[680px] font-display text-[29px] leading-[1.5] font-medium tracking-[-.7px] max-[600px]:text-[22px]">{contact.assistance}</p>
        </div>
      </PageContainer>
    </section>
  );
}
