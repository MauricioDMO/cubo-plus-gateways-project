"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/ui/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      data-slot="calendar"
      showOutsideDays={showOutsideDays}
      className={cn("ui-calendar relative w-full text-[13px]", className)}
      classNames={{
        months: "w-full",
        month: "w-full",
        month_caption: "flex items-center justify-center min-h-8.5 relative",
        caption_label: "text-heading font-[750]",
        nav: "pointer-events-none absolute inset-0",
        button_previous: `absolute left-0 inline-flex size-8 items-center justify-center bg-background text-heading cursor-pointer pointer-events-auto p-0
          rounded-lg border border-text/10`,
        button_next: `absolute right-0 inline-flex size-8 items-center justify-center bg-background text-heading cursor-pointer pointer-events-auto p-0
          rounded-lg border border-text/10`,
        month_grid: "w-full border-separate border-spacing-x-0 border-spacing-y-1 mt-2",
        weekdays: "grid grid-cols-7",
        weekday: "text-muted-text text-[11px] font-extrabold tracking-[0.04em] leading-[26px] text-center uppercase",
        week: "grid grid-cols-7",
        day: "grid min-w-0 place-items-center",
        day_button: `grid size-8.5 bg-transparent text-heading cursor-pointer [font-family:inherit] [font-size:inherit]
          [font-weight:inherit] [font-style:inherit] leading-none [font-variant:inherit] place-items-center rounded-full border-0
          hover:bg-text/6`,
        today: "[&>button]:border [&>button]:border-link/40",
        selected: "[&>button]:bg-button-bg [&>button:hover]:bg-button-bg [&>button]:text-button-text",
        outside: "[&>button]:text-text/28",
        disabled: "[&>button]:text-text/22 [&>button]:cursor-not-allowed [&>button]:line-through [&>button:hover]:bg-transparent",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...chevronProps }) =>
          orientation === "left" ? (
            <ChevronLeft size={16} aria-hidden="true" {...chevronProps} />
          ) : (
            <ChevronRight size={16} aria-hidden="true" {...chevronProps} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
