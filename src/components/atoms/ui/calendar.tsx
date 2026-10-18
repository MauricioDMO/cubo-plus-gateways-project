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
      className={cn("ui-calendar", className)}
      classNames={{
        months: "ui-calendar__months",
        month: "ui-calendar__month",
        month_caption: "ui-calendar__caption",
        caption_label: "ui-calendar__caption-label",
        nav: "ui-calendar__nav",
        button_previous: "ui-calendar__nav-button ui-calendar__nav-button--previous",
        button_next: "ui-calendar__nav-button ui-calendar__nav-button--next",
        month_grid: "ui-calendar__table",
        weekdays: "ui-calendar__weekdays",
        weekday: "ui-calendar__weekday",
        week: "ui-calendar__week",
        day: "ui-calendar__day",
        day_button: "ui-calendar__day-button",
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
