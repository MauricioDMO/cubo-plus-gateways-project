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
        nav: "top-0 right-0 bottom-0 left-0 pointer-events-none absolute",
        button_previous: `inline-flex items-center justify-center w-8 h-8 bg-background text-heading cursor-pointer pointer-events-auto p-0
          rounded-[8px] border border-solid border-[rgba(15,_23,_39,_0.1)] [&&]:left-0 [&&]:absolute`,
        button_next: `inline-flex items-center justify-center w-8 h-8 bg-background text-heading cursor-pointer pointer-events-auto p-0
          rounded-[8px] border border-solid border-[rgba(15,_23,_39,_0.1)] [&&]:right-0 [&&]:absolute`,
        month_grid: "w-full border-separate border-spacing-x-0 border-spacing-y-1 mt-2",
        weekdays: "grid grid-cols-7",
        weekday: "text-muted-text text-[11px] font-extrabold tracking-[0.04em] leading-[26px] text-center uppercase",
        week: "grid grid-cols-7",
        day: "grid min-w-0 place-items-center",
        day_button: String.raw`grid w-8.5 h-8.5 bg-transparent text-heading cursor-pointer [font-family:inherit] [font-size:inherit]
          [font-weight:inherit] [font-style:inherit] leading-none [font-variant:inherit] place-items-center rounded-full border-0
          hover:bg-[rgba(15,_23,_39,_0.06)] [.ui-calendar\_\_day--today_&]:border [.ui-calendar\_\_day--today_&]:border-solid
          [.ui-calendar\_\_day--today_&]:border-[rgba(3,_155,_229,_0.4)] [.ui-calendar\_\_day--selected_&]:bg-button-bg
          [.ui-calendar\_\_day--selected_&]:text-button-text [.ui-calendar\_\_day--outside_&]:text-[rgba(15,_23,_39,_0.28)]
          [.ui-calendar\_\_day--disabled_&]:text-[rgba(15,_23,_39,_0.22)] [.ui-calendar\_\_day--disabled_&]:cursor-not-allowed
          [.ui-calendar\_\_day--disabled_&]:line-through [.ui-calendar\_\_day--disabled_&:hover]:bg-transparent`,
        today: "ui-calendar__day--today",
        selected: "ui-calendar__day--selected",
        range_start: "ui-calendar__day--range-start",
        range_middle: "ui-calendar__day--range-middle",
        range_end: "ui-calendar__day--range-end",
        outside: "ui-calendar__day--outside",
        disabled: "ui-calendar__day--disabled",
        hidden: "ui-calendar__day--hidden",
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
