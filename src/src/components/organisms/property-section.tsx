"use client";

import { useState } from "react";
import { properties, SITE_URL } from "@/content/landing";
import { Icon } from "../atoms/icon";
import { PageContainer } from "../atoms/page-container";
import { SectionHeading } from "../molecules/section-heading";
import { PropertyCard } from "../molecules/property-card";

const filters = ["All stays", "Apartments", "Villas"] as const;

export function PropertySection() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All stays");
  const visible = properties.filter((property) => filter === "All stays" || property.category === filter);

  return (
    <section className="py-[90px] max-[850px]:py-[65px] max-[600px]:py-[50px]" id="properties" aria-labelledby="properties-title">
      <PageContainer>
      <SectionHeading eyebrow="MAKE YOURSELF AT HOME" title="Somewhere you’ll want to stay." description="Handpicked properties. Thoughtful details. A coast to call your own." />
      <h3 id="properties-title" className="sr-only">Featured properties</h3>
      <div className="mb-[27px] flex items-center justify-between gap-5 max-[600px]:mb-5 max-[600px]:flex-col max-[600px]:items-start max-[600px]:gap-2.5">
        <div className="inline-flex gap-[5px] max-[600px]:gap-1" role="group" aria-label="Filter properties by category">
          {filters.map((item) => <button className="cursor-pointer inline-flex min-h-11 items-center gap-[9px] rounded-full border border-transparent bg-transparent px-[17px] py-[9px] text-[11px] text-ink-body hover:bg-coastal/5 aria-pressed:bg-coastal aria-pressed:text-inverse max-[600px]:px-[15px] max-[600px]:text-[10px]" key={item} type="button" aria-pressed={filter === item} aria-controls="property-results" onClick={() => setFilter(item)}>{item}{item === "All stays" && <span className="grid size-[18px] place-items-center rounded-full bg-inverse/15 text-[9px]">{properties.length}</span>}</button>)}
        </div>
        <a className="group inline-flex items-center gap-[17px] py-2 text-xs font-medium whitespace-nowrap max-[600px]:self-end max-[600px]:text-[11px]" href={`${SITE_URL}/properties/`}>View all properties<Icon className="transition-transform motion-reduce:transition-none duration-200 group-hover:translate-x-1" name="arrow" /></a>
      </div>
      <p className="sr-only" role="status">{visible.length} featured {visible.length === 1 ? "property" : "properties"} shown</p>
      <div className="grid grid-cols-3 items-start gap-[23px] max-[850px]:grid-cols-2 max-[600px]:grid-cols-1 max-[600px]:gap-[22px]" id="property-results">{visible.map((property) => <PropertyCard key={property.name} property={property} />)}</div>
      </PageContainer>
    </section>
  );
}
