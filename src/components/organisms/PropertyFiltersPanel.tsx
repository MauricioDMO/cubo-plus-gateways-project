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
    <aside className="properties-filters" aria-label="Filter properties" data-open={open ? "true" : undefined}>
      <button
        type="button"
        className="properties-filters__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        <span>Refine search</span>
        <span className="properties-filters__toggle-count">
          {activeFilterCount > 0
            ? `${activeFilterCount} active`
            : open
              ? "Hide"
              : "Show"}
        </span>
      </button>
      <div className="properties-filters__panel" id={panelId}>
        {children}
      </div>
    </aside>
  );
}
