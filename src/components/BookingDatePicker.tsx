"use client";

import { useState } from "react";

import { trimShortMonth } from "@/lib/time";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
          className={cn("booking-date-trigger", className)}
        >
          <CalendarDays size={17} aria-hidden="true" />
          <span>{formatDate(value, placeholder)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="booking-date-popover" align="start">
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
