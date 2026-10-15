"use client";

import Image from "next/image";
import { useState } from "react";
import { testimonials } from "@/content/landing";
import { Icon } from "../atoms/icon";
import { PageContainer } from "../atoms/page-container";

export function TestimonialSection() {
  const [index, setIndex] = useState(0);
  const review = testimonials[index];

  return (
    <PageContainer>
    <section className="grid grid-cols-[.95fr_1.05fr] overflow-hidden rounded-feature bg-coastal/10 max-[850px]:grid-cols-[.85fr_1.15fr] max-[600px]:grid-cols-1" aria-labelledby="testimonials-title" aria-roledescription="carousel">
      <div className="relative isolate min-h-[540px] after:absolute after:inset-x-0 after:top-[60%] after:bottom-0 after:-z-10 after:bg-linear-to-b after:from-transparent after:to-coastal/60 max-[1150px]:min-h-[560px] max-[850px]:min-h-[610px] max-[600px]:h-80 max-[600px]:min-h-0">
        <Image className="-z-20" src={review.image} alt={review.alt} fill sizes="(max-width: 700px) 100vw, 45vw" />
        <span className="absolute right-5 bottom-[30px] left-[30px] flex items-center gap-2.5 text-[11px] text-inverse max-[850px]:left-[22px] max-[850px]:text-[10px] max-[600px]:bottom-[23px] max-[600px]:left-[25px]"><Icon className="size-6" name="wave" />Good places. Even better memories.</span>
      </div>
      <div className="flex flex-col px-[60px] pt-[55px] pb-[35px] max-[1150px]:px-[35px] max-[1150px]:pt-10 max-[1150px]:pb-[30px] max-[850px]:px-7 max-[850px]:pt-[34px] max-[850px]:pb-[25px] max-[600px]:pt-8">
        <p className="text-[9px] leading-[1.6] font-semibold tracking-[2px] text-ink-muted">WORDS FROM OUR GUESTS</p>
        <h2 className="mt-3 font-display text-[clamp(25px,2.5vw,33px)] leading-[1.25] font-medium tracking-[-1.3px] text-ink-strong max-[850px]:text-[25px] max-[600px]:text-[27px]" id="testimonials-title">The stays are special.<br />The stories say it best.</h2>
        <span className="mt-[15px] h-[45px] font-serif text-[75px] leading-[1.2] text-coastal/50" aria-hidden="true">“</span>
        <div className="flex-1" aria-live="polite" aria-atomic="true">
          <blockquote className="min-h-[164px] text-sm leading-[1.95] text-ink-body max-[850px]:text-xs max-[600px]:min-h-[200px] max-[600px]:text-[13px] max-[600px]:leading-[1.9]">{review.quote}</blockquote>
          <div className="mt-[21px] flex items-center gap-3 max-[600px]:mt-6"><span className="grid size-[37px] place-items-center rounded-full bg-coastal/10 text-[10px] font-semibold" aria-hidden="true">{review.name.split(" ").map((name) => name[0]).join("")}</span><div><p className="text-xs font-medium">{review.name}</p><span className="text-[10px] text-ink-muted">{review.role}</span></div></div>
        </div>
        <div className="mt-[23px] flex items-center justify-between max-[600px]:mt-[15px]">
          <div className="flex" role="group" aria-label="Choose a guest review">{testimonials.map((item, position) => <button className="group grid min-h-11 min-w-[26px] place-items-center border-0 bg-transparent px-[5px] py-3" key={item.name} aria-label={`Review ${position + 1}: ${item.name}`} aria-pressed={position === index} onClick={() => setIndex(position)}><span className="block size-[5px] rounded-full bg-coastal/25 transition-[width] duration-200 group-aria-pressed:w-[22px] group-aria-pressed:bg-coastal" /></button>)}</div>
          <div className="flex gap-[9px]"><button className="inline-flex size-11 items-center justify-center rounded-full border border-divider bg-transparent text-ink-strong transition-colors duration-200 hover:bg-coastal/10" aria-label="Previous guest review" onClick={() => setIndex((current) => (current - 1 + testimonials.length) % testimonials.length)}><Icon className="rotate-180" name="arrow" /></button><button className="inline-flex size-11 items-center justify-center rounded-full border border-divider bg-transparent text-ink-strong transition-colors duration-200 hover:bg-coastal/10" aria-label="Next guest review" onClick={() => setIndex((current) => (current + 1) % testimonials.length)}><Icon name="arrow" /></button></div>
        </div>
      </div>
    </section>
    </PageContainer>
  );
}
