"use client";

import { useState } from "react";

import { trimShortMonth } from "@/shared/utils/time";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/atoms/ui/button";
import { Calendar } from "@/components/atoms/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/atoms/ui/popover";
import { cn } from "@/shared/ui/utils";

type BookingDatePickerProps = {
  id: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
  className?: string;
  /** Shown while no date is chosen. The booking form asks you to "Select date";
      the homepage search bar invites you to "Add dates". */
  placeholder?: string;
};

function isoToDate(value?: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function dateToIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/*
 * "Sat 5 Sep", not "05/09/2026".
 *
 * A slashed numeric date is what a browser's own date input shows, and it read
 * as one -- the field looked like a form control borrowed from somewhere else
 * rather than part of this site. The weekday is the useful half of a booking
 * date anyway: people choose a Friday, not the fifth.
 *
 * The year appears only when it is not this one, so the common case stays
 * short and a stay booked across new year is still unambiguous.
 */
function formatDate(value: string | undefined, placeholder: string) {
  const date = isoToDate(value);
  if (!date) return placeholder;
  const thisYear = date.getFullYear() === new Date().getFullYear();
  /*
   * The weekday goes when the year has to be shown.
   *
   * Both together need 163px in a field the sidebar gives 134, so the value
   * would be cut mid-word. For a date next year the year is the part that
   * disambiguates and the weekday is the part a guest can work out, so it is
   * the weekday that leaves.
   */
  return trimShortMonth(
    new Intl.DateTimeFormat(
      "en-GB",
      thisYear
        ? { weekday: "short", day: "numeric", month: "short" }
        : { day: "numeric", month: "short", year: "numeric" }
    ).format(date)
  );
}

export default function BookingDatePicker({ id, value, min, onChange, className, placeholder = "Select date" }: BookingDatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = isoToDate(value);
  const minDate = isoToDate(min);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          /* data-empty lets the CSS mute the "Select date" placeholder the same
             way ::placeholder mutes it in the sibling text fields -- without it
             a chosen date and an unchosen one looked identical. */
          data-empty={value ? undefined : "true"}
          className={cn(String.raw`booking-date-trigger inline-flex h-auto w-full min-h-12 items-center justify-start gap-[7px] rounded-[10px] border
            border-[rgba(15,23,39,0.18)] bg-background px-2.5 py-0 text-left text-[15px] font-semibold leading-[normal]
            [transition:border-color_0.15s_ease,box-shadow_0.15s_ease] hover:border-[rgba(15,23,39,0.42)]
            focus-visible:[outline:none] focus-visible:border-heading focus-visible:shadow-[0_0_0_3px_rgba(15,23,39,0.12)]
            [&_span]:overflow-hidden [&_span]:whitespace-nowrap [&_span]:text-ellipsis [&_span]:tabular-nums
            [&[data-empty]_span]:text-muted-text [&[data-empty]_span]:font-normal [&_svg]:flex-none [&_svg]:text-muted-text
            [.booking-widget_&]:font-body [.booking-widget_&]:leading-[1.35] [.concierge-form\_\_details_&]:w-full
            [.concierge-form\_\_details_&]:min-w-0 [.concierge-form\_\_details_&]:min-h-13
            [.concierge-form\_\_details_&]:bg-[rgba(255,_255,_255,_0.68)] [.concierge-form\_\_details_&]:shadow-none
            [.concierge-form\_\_details_&]:text-[#26312f] [.concierge-form\_\_details_&]:[font-family:inherit]
            [.concierge-form\_\_details_&]:text-[15px] [.concierge-form\_\_details_&]:[font-weight:inherit]
            [.concierge-form\_\_details_&]:[font-style:inherit] [.concierge-form\_\_details_&]:leading-[inherit]
            [.concierge-form\_\_details_&]:[font-variant:inherit]
            [.concierge-form\_\_details_&]:[transition:border-color_0.16s_ease,_box-shadow_0.16s_ease,_background-color_0.16s_ease]
            [.concierge-form\_\_details_&]:inline-flex [.concierge-form\_\_details_&]:items-center
            [.concierge-form\_\_details_&]:justify-between [.concierge-form\_\_details_&]:text-left
            [.concierge-form\_\_details_&]:px-3.75 [.concierge-form\_\_details_&]:py-3.25 [.concierge-form\_\_details_&]:gap-3
            [.concierge-form\_\_details_&]:rounded-[8px] [.concierge-form\_\_details_&]:border
            [.concierge-form\_\_details_&]:border-solid [.concierge-form\_\_details_&]:border-[rgba(57,_67,_66,_0.28)]
            [.concierge-form\_\_details_&:hover:not(:disabled)]:bg-[rgba(255,_255,_255,_0.9)]
            [.concierge-form\_\_details_&:hover:not(:disabled)]:border-[rgba(57,_67,_66,_0.52)]
            [.concierge-form\_\_details_&:focus-visible]:bg-[rgba(255,_255,_255,_0.96)]
            [.concierge-form\_\_details_&:focus-visible]:shadow-[0_0_0_3px_rgba(57,_67,_66,_0.13)]
            [.concierge-form\_\_details_&:focus-visible]:[outline:none] [.concierge-form\_\_details_&:focus-visible]:border-[#394342]
            [.concierge-form\_\_details_&]:motion-reduce:transition-none`, className)}
        >
          <CalendarDays size={17} aria-hidden="true" />
          <span>{formatDate(value, placeholder)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="[[data-slot=popover-content]&]:z-[70] [[data-slot=popover-content]&]:bg-[rgb(253,_253,_252)]
        [[data-slot=popover-content]&]:text-heading [[data-slot=popover-content]&]:shadow-[0_18px_42px_rgba(15,_23,_39,_0.16)]
        [[data-slot=popover-content]&]:w-[min(320px,_calc(100vw_-_32px))] [[data-slot=popover-content]&]:p-3
        [[data-slot=popover-content]&]:rounded-[10px] [[data-slot=popover-content]&]:border [[data-slot=popover-content]&]:border-solid
        [[data-slot=popover-content]&]:border-[rgba(15,_23,_39,_0.12)] [&_[data-slot=calendar]_button]:max-[900.001px]:min-w-10
        [&_[data-slot=calendar]_button]:max-[900.001px]:min-h-10" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate ?? minDate}
          disabled={minDate ? { before: minDate } : undefined}
          onSelect={(date) => {
            if (!date) return;
            onChange(dateToIso(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
