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
    <aside className="properties-filters sticky top-6 w-full bg-transparent shadow-none m-0 rounded-[0] border-0 [&_form]:flex [&_form]:flex-col
      [&_form]:p-0 [&_form]:gap-5 max-[860.001px]:static max-[860.001px]:mb-7 max-[860.001px]:bg-background
      max-[860.001px]:shadow-[0_18px_45px_rgba(7,_36,_86,_0.06)] max-[860.001px]:min-w-0 max-[860.001px]:p-4.5
      max-[860.001px]:rounded-[8px] max-[860.001px]:border max-[860.001px]:border-solid max-[860.001px]:border-border
      [&:not([data-open=true])]:max-[860.001px]:shadow-none [&:not([data-open=true])]:max-[860.001px]:my-0
      [&:not([data-open=true])]:max-[860.001px]:p-0 [&:not([data-open=true])]:max-[860.001px]:border-0
      [&_form]:max-[560.001px]:grid-cols-1" aria-label="Filter properties" data-open={open ? "true" : undefined}>
      <button
        type="button"
        className="hidden max-[860.001px]:flex max-[860.001px]:items-center max-[860.001px]:w-full max-[860.001px]:min-h-12
          max-[860.001px]:bg-transparent max-[860.001px]:text-heading max-[860.001px]:[font-family:inherit] max-[860.001px]:text-[13px]
          max-[860.001px]:font-bold max-[860.001px]:uppercase max-[860.001px]:tracking-[0.08em] max-[860.001px]:cursor-pointer
          max-[860.001px]:m-0 max-[860.001px]:px-1 max-[860.001px]:py-0 max-[860.001px]:gap-2.5 max-[860.001px]:border-0
          [.properties-filters:not([data-open=true])_&]:max-[860.001px]:min-h-11
          [.properties-filters:not([data-open=true])_&]:max-[860.001px]:bg-background
          [.properties-filters:not([data-open=true])_&]:max-[860.001px]:px-3
          [.properties-filters:not([data-open=true])_&]:max-[860.001px]:py-0
          [.properties-filters:not([data-open=true])_&]:max-[860.001px]:rounded-[8px]
          [.properties-filters:not([data-open=true])_&]:max-[860.001px]:border
          [.properties-filters:not([data-open=true])_&]:max-[860.001px]:border-solid
          [.properties-filters:not([data-open=true])_&]:max-[860.001px]:border-border"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        <span>Refine search</span>
        <span className="max-[860.001px]:ml-auto max-[860.001px]:text-muted-text max-[860.001px]:text-[12px] max-[860.001px]:font-semibold
          max-[860.001px]:normal-case max-[860.001px]:tracking-[0]">
          {activeFilterCount > 0
            ? `${activeFilterCount} active`
            : open
              ? "Hide"
              : "Show"}
        </span>
      </button>
      <div className="block max-[860.001px]:hidden [.properties-filters[data-open=true]_&]:max-[860.001px]:block
        [.properties-filters[data-open=true]_&]:max-[860.001px]:mt-4.5" id={panelId}>
        {children}
      </div>
    </aside>
  );
}
