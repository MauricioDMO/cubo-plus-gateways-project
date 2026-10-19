import Image from "next/image";
import { Waves } from "lucide-react";

import ContactDetails from "@/components/molecules/ContactDetails";

export default function ContactSection({ title }: { title: string }) {
  return (
    <section className="-mx-6 px-8 pb-10 text-sm leading-[1.65] max-[600px]:-mt-4 max-[600px]:px-5 max-[600px]:pb-2" aria-labelledby="contact-title">
      <div className="grid grid-cols-[1.1fr_.9fr] items-center gap-16 max-[1150px]:gap-10 max-[850px]:grid-cols-1 max-[850px]:gap-0">
        <div className="min-w-0 pt-4 max-[600px]:pt-0">
          <p className="mb-5 flex items-center gap-3 text-[10px] leading-[1.65] font-semibold tracking-[2px] text-muted-text"><span className="h-px w-6 bg-button-bg" />GETAWAYS EL SALVADOR</p>
          <h1 className="font-heading text-[clamp(54px,6vw,76px)] leading-[1.1] font-medium tracking-[-3px] text-heading max-[600px]:text-[52px] max-[600px]:tracking-[-2px]" id="contact-title">{title}<span className="text-[rgba(7,36,86,.35)]">.</span></h1>
          <p className="mt-6 mb-0 text-base leading-[1.9]">At Getaways El Salvador, we’re here to help make your stay in El Zonte seamless — whether you’re planning a surf getaway, looking for a longer stay, or exploring rental management opportunities.</p>
          <p className="mt-5 mb-0 text-sm leading-[1.9]">For booking inquiries, property management information, or general questions, feel free to reach out to us directly:</p>
        </div>
        <ContactDetails />
      </div>
      <div className="relative isolate mt-16 overflow-hidden rounded-[15px] bg-button-bg px-12 py-14 text-white max-[600px]:mt-10 max-[600px]:px-7 max-[600px]:py-10">
        <Image src="/media/contact-coast.jpg" alt="Pacific waves along the palm-lined coast of El Salvador" fill sizes="(max-width: 1204px) 100vw, 1140px" className="-z-20 object-cover object-[50%_60%]" />
        <div className="absolute inset-0 -z-10 bg-button-bg/70" />
        <Waves className="mb-5 block h-6 w-10 text-white/80" strokeWidth={1.5} aria-hidden="true" />
        <p className="mb-0 max-w-170 font-heading text-[29px] leading-[1.5] font-medium tracking-[-.7px] text-white max-[600px]:text-[22px]">We’ll be happy to assist you and help you plan your stay on El Salvador’s beautiful Pacific coast.</p>
      </div>
    </section>
  );
}
