import Image from "next/image";
import { SITE_URL } from "@/content/landing";
import { Icon } from "../atoms/icon";
import { ButtonLink } from "../atoms/button-link";
import { PageContainer } from "../atoms/page-container";

export function Hero() {
  return (
    <section className="relative isolate mx-6 h-[min(760px,calc(100svh-130px))] min-h-[650px] overflow-hidden rounded-feature bg-coastal text-inverse max-[850px]:h-auto max-[850px]:min-h-[610px] max-[600px]:mx-3 max-[600px]:rounded-[13px]" aria-labelledby="hero-title">
      <Image className="-z-20 object-cover object-[50%_53%] max-[600px]:object-[56%_center]" src="/getaways/coast.jpg" alt="Pacific waves rolling onto the palm-lined coast of El Salvador" fill sizes="100vw" preload />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(10,32,29,.66),rgba(10,32,29,.22)_60%,rgba(10,32,29,.02)),linear-gradient(0deg,rgba(8,28,23,.38),transparent_35%)] max-[600px]:bg-[linear-gradient(90deg,#102e287d,#102e2833),linear-gradient(0deg,#102e2844,transparent_45%)]" />
      <PageContainer className="pt-[90px] pb-[120px] min-[1600px]:pt-[115px] max-[1150px]:px-12! max-[850px]:pt-20 max-[850px]:pb-[130px] max-[600px]:px-[27px]! max-[600px]:pt-[72px] max-[600px]:pb-[120px]">
        <p className="flex items-center gap-3 text-[10px] leading-[1.6] font-normal tracking-[2.6px] uppercase max-[600px]:gap-[9px] max-[600px]:text-[8px] max-[600px]:tracking-[1.6px]"><span className="h-px w-6 bg-inverse/85 max-[600px]:w-[17px]" />A little closer to the ocean</p>
        <h1 className="mt-[23px] mb-[21px] font-display text-[clamp(64px,6.8vw,98px)] leading-[1.07] font-medium tracking-[-5px] max-[1150px]:text-[80px] max-[850px]:text-[74px] max-[850px]:tracking-[-4px] max-[600px]:mt-7 max-[600px]:mb-[22px] max-[600px]:text-[clamp(47px,12vw,70px)] max-[600px]:leading-[1.13] max-[600px]:tracking-[-2.8px]" id="hero-title">Getaways<br />Concierge<span className="text-inverse/85">.</span></h1>
        <p className="w-[365px] max-w-full text-base leading-[1.8] text-inverse/90 max-[600px]:w-[280px] max-[600px]:text-sm max-[600px]:leading-[1.85]">Book a complimentary call, and we’ll build your stay in El Salvador.</p>
        <div className="mt-[30px] flex items-center gap-[30px] max-[600px]:mt-7 max-[600px]:flex-wrap max-[600px]:gap-[18px]">
          <ButtonLink variant="light" href={`${SITE_URL}/contact-us/`}>Plan your getaway</ButtonLink>
          <a className="inline-flex items-center gap-2.5 border-b border-inverse/40 py-[9px] text-[12px] max-[600px]:gap-1.5 max-[600px]:text-[10px]" href="#properties">Explore our stays<Icon name="diagonal" className="size-3.5" /></a>
        </div>
      </PageContainer>
      <div className="absolute inset-x-14 bottom-[30px] flex items-center justify-between text-[10px] tracking-[.4px] min-[1600px]:inset-x-[max(56px,calc((100%-1200px)/2))] max-[850px]:inset-x-10 max-[600px]:right-5 max-[600px]:bottom-[25px] max-[600px]:left-[27px] max-[600px]:text-[8px]">
        <span className="flex items-center gap-2"><Icon name="pin" className="size-[15px]" />El Zonte · Surf City · El Salvador</span>
        <a className="flex items-center gap-[17px] max-[850px]:hidden" href="#discover">A place to slow down <span className="grid size-[34px] place-items-center rounded-full border border-inverse/40"><Icon name="arrow" className="w-[15px] rotate-90" /></span></a>
      </div>
    </section>
  );
}
