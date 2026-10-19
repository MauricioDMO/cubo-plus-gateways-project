"use client";

import { useId, useState } from "react";
import { SlidersHorizontal } from "lucide-react";

/*
 * The /properties filter rail, collapsible on phones.
 *
 * The filter form is ~2000px tall: eleven amenity fieldsets, category radios,
 * three numeric fields and the pets select. On a phone it sits above the
 * results in document order, so a visitor arriving at /properties had to
 * scroll past the entire form before reaching a single property — on the page
 * whose whole purpose is the properties.
 *
 * Collapsed by default and opened by the button. Nothing here runs on
 * desktop: the CSS keeps the panel open and the button hidden above 860px, so
 * the server-rendered markup is correct at first paint either way and the
 * state below only ever matters on a narrow screen.
 */
export default function PropertyFiltersPanel({
  activeFilterCount,
  children,
}: {
  activeFilterCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <aside className="group/filters sticky top-6 w-full bg-transparent shadow-none m-0 rounded-none border-0
      max-[860.001px]:static max-[860.001px]:mb-7 max-[860.001px]:bg-background
      max-[860.001px]:shadow-[0_18px_45px_rgba(7,_36,_86,_0.06)] max-[860.001px]:min-w-0 max-[860.001px]:p-4.5
      max-[860.001px]:rounded-lg max-[860.001px]:border max-[860.001px]:border-border
      max-[860.001px]:not-data-[open=true]:shadow-none max-[860.001px]:not-data-[open=true]:my-0
      max-[860.001px]:not-data-[open=true]:p-0 max-[860.001px]:not-data-[open=true]:border-0" aria-label="Filter properties" data-open={open ? "true" : undefined}>
      <button
        type="button"
        className="hidden max-[860.001px]:flex items-center w-full min-h-12 bg-transparent text-heading font-[inherit] text-[13px]
          font-bold uppercase tracking-[0.08em] cursor-pointer m-0 px-1 py-0 gap-2.5 border-0
          group-not-data-[open=true]/filters:min-h-11 group-not-data-[open=true]/filters:bg-background
          group-not-data-[open=true]/filters:px-3 group-not-data-[open=true]/filters:rounded-lg
          group-not-data-[open=true]/filters:border group-not-data-[open=true]/filters:border-border"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        <span>Refine search</span>
        <span className="ml-auto text-muted-text text-[12px] font-semibold normal-case tracking-normal">
          {activeFilterCount > 0
            ? `${activeFilterCount} active`
            : open
              ? "Hide"
              : "Show"}
        </span>
      </button>
      <div className="block max-[860.001px]:group-not-data-[open=true]/filters:hidden
        max-[860.001px]:group-data-[open=true]/filters:mt-4.5" id={panelId}>
        {children}
      </div>
    </aside>
  );
}
