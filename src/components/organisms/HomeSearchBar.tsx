"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import BookingDatePicker from "@/components/molecules/BookingDatePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/ui/select";
import type { Destination } from "@/modules/listings/locations";

/*
 * The homepage search bar.
 *
 * This is a FILTER, not a booking form: it never creates a booking or touches
 * a payment provider. It collects the three things a guest picks before they
 * have chosen a property -- where, when, how many -- and hands them to
 * /properties as query params. The guest then picks a property and books it
 * on the listing page, where the real availability check and payment live.
 *
 * Destinations come from the listings themselves (attributes.location), so a
 * property added in a new town shows up here without a code change.
 */

type HomeSearchBarProps = {
  destinations: Destination[];
  /** Largest occupancy across the catalogue -- caps the guest picker. */
  maxGuests: number;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(date: string, days: number) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function formatShortDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, day))
  );
}

export default function HomeSearchBar({ destinations, maxGuests }: HomeSearchBarProps) {
  const router = useRouter();
  const [destination, setDestination] = useState(destinations[0]?.slug ?? "");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("");
  // Phones only -- the CSS keeps the fields open and the summary hidden above
  // 900px, so this never affects a desktop render and the server-rendered
  // markup is right at first paint either way.
  const [expanded, setExpanded] = useState(false);

  const guestOptions = Array.from({ length: Math.max(1, maxGuests) }, (_, i) => i + 1);

  const destinationLabel = destinations.find((d) => d.slug === destination)?.label;
  const summary = [
    destinationLabel?.split(",")[0],
    checkIn && checkOut ? `${formatShortDate(checkIn)} – ${formatShortDate(checkOut)}` : "Any dates",
    guests ? `${guests} ${guests === "1" ? "guest" : "guests"}` : "Any guests",
  ]
    .filter(Boolean)
    .join("  ·  ");

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (checkIn) params.set("check_in", checkIn);
    if (checkOut) params.set("check_out", checkOut);
    if (guests) params.set("guests", guests);
    router.push(`/properties?${params.toString()}`);
  }

  // Choosing a check-in before an existing check-out would leave an impossible
  // range sitting in the form, so the check-out is pushed along with it.
  function updateCheckIn(next: string) {
    setCheckIn(next);
    if (checkOut && checkOut <= next) setCheckOut(addDaysIso(next, 1));
  }

  return (
    <form className="home-search relative z-[2] grid grid-cols-[minmax(0,_1.1fr)_minmax(0,_1.4fr)_minmax(0,_0.9fr)_auto] items-stretch
      w-[min(100%,_1204px)] mt-[-82px] mb-0 bg-background shadow-[0_5px_30px_rgba(7,_36,_86,_0.075)] overflow-hidden mx-auto
      rounded-[10px] max-[900.001px]:grid-cols-1 max-[900.001px]:mt-[-28px] max-[900.001px]:w-[min(100%_-_32px,_1204px)]" onSubmit={handleSearch} data-expanded={expanded ? "true" : undefined}>
      {/* Collapsed, the whole search is one 64px row instead of four stacked
          fields and a button. On a phone the expanded bar is 366px and does
          not fit above the fold at all, which pushed the first property down
          to nearly four screens of scrolling. Tapping this opens the fields
          in place. */}
      <button type="button" className="hidden max-[900.001px]:flex max-[900.001px]:items-center max-[900.001px]:w-full max-[900.001px]:min-h-16
        max-[900.001px]:bg-transparent max-[900.001px]:text-text max-[900.001px]:[font-family:inherit] max-[900.001px]:text-left
        max-[900.001px]:cursor-pointer max-[900.001px]:px-4.5 max-[900.001px]:py-0 max-[900.001px]:gap-3 max-[900.001px]:border-0
        [&_svg]:max-[900.001px]:flex-none [&_svg]:max-[900.001px]:text-link [.home-search[data-expanded=true]_&]:max-[900.001px]:hidden" onClick={() => setExpanded(true)} aria-expanded={expanded}>
        <Search size={18} aria-hidden="true" />
        <span className="max-[900.001px]:flex max-[900.001px]:flex-col max-[900.001px]:min-w-0 max-[900.001px]:gap-0.5
          [&_strong]:max-[900.001px]:font-heading [&_strong]:max-[900.001px]:text-[16px] [&_small]:max-[900.001px]:overflow-hidden
          [&_small]:max-[900.001px]:text-ellipsis [&_small]:max-[900.001px]:whitespace-nowrap [&_small]:max-[900.001px]:text-[12.5px]
          [&_small]:max-[900.001px]:text-muted-text">
          <strong>Where to?</strong>
          <small>{summary}</small>
        </span>
      </button>

      <div className="flex flex-col justify-center min-w-0 border-r border-solid border-r-border px-6 py-4.5 gap-1.5 max-[900.001px]:hidden
        max-[900.001px]:border-r-0 max-[900.001px]:border-b max-[900.001px]:border-solid max-[900.001px]:border-b-border
        max-[900.001px]:px-4.5 max-[900.001px]:py-3 [.home-search[data-expanded=true]_&]:max-[900.001px]:flex">
        <span className="text-[11px] leading-none font-bold tracking-[1px] uppercase text-muted-text" id="home-search-destination-label">
          Destination
        </span>
        <Select value={destination} onValueChange={setDestination}>
          <SelectTrigger
            className="[.home-search_&]:h-auto [.home-search_&]:min-h-0 [.home-search_&]:bg-transparent [.home-search_&]:shadow-none
              [.home-search_&]:text-[15px] [.home-search_&]:text-link [.home-search_&]:justify-start [.home-search_&]:text-left
              [.home-search_&]:p-0 [.home-search_&]:gap-1.5 [.home-search_&]:border-0 [.home-search_&_[data-slot=select-value]]:text-left
              [.home-search_&:hover]:bg-transparent [.home-search_&:hover]:text-link-strong [.home-search_&:hover]:border-0
              [.home-search_&:focus-visible]:[outline:2px_solid_var(--color-link)] [.home-search_&:focus-visible]:outline-offset-[3px]
              [.home-search_&:focus-visible]:rounded-[3px] [.home-search_&[data-empty=true]]:text-muted-text
              [.home-search_&]:max-[900.001px]:min-h-11 [.home-search_&]:max-[900.001px]:text-[16px] [.home-search_&]:max-[900.001px]:px-0.5
              [.home-search_&]:max-[900.001px]:py-0 [.home-search\_\_dates_&]:max-[900.001px]:flex-1
              [.home-search\_\_dates_&]:max-[900.001px]:min-w-0 [.home-search\_\_dates_&]:max-[900.001px]:justify-start"
            aria-labelledby="home-search-destination-label"
            data-empty={destination ? undefined : "true"}
          >
            <SelectValue placeholder="Anywhere" />
          </SelectTrigger>
          <SelectContent>
            {destinations.map((option) => (
              <SelectItem key={option.slug} value={option.slug}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col justify-center min-w-0 border-r border-solid border-r-border px-6 py-4.5 gap-1.5 max-[900.001px]:hidden
        max-[900.001px]:border-r-0 max-[900.001px]:border-b max-[900.001px]:border-solid max-[900.001px]:border-b-border
        max-[900.001px]:px-4.5 max-[900.001px]:py-3 [.home-search[data-expanded=true]_&]:max-[900.001px]:flex home-search__field--dates">
        <span className="text-[11px] leading-none font-bold tracking-[1px] uppercase text-muted-text" id="home-search-dates-label">
          Dates
        </span>
        <div className="home-search__dates flex items-center min-w-0 gap-2 max-[900.001px]:gap-1.5" role="group" aria-labelledby="home-search-dates-label">
          <BookingDatePicker
            id="home-search-check-in"
            min={todayIso()}
            value={checkIn}
            onChange={updateCheckIn}
            className="[.home-search_&]:h-auto [.home-search_&]:min-h-0 [.home-search_&]:bg-transparent [.home-search_&]:shadow-none
              [.home-search_&]:text-[15px] [.home-search_&]:text-link [.home-search_&]:justify-start [.home-search_&]:text-left
              [.home-search_&]:p-0 [.home-search_&]:gap-1.5 [.home-search_&]:border-0 [.home-search_&_[data-slot=select-value]]:text-left
              [.home-search_&:hover]:bg-transparent [.home-search_&:hover]:text-link-strong [.home-search_&:hover]:border-0
              [.home-search_&:focus-visible]:[outline:2px_solid_var(--color-link)] [.home-search_&:focus-visible]:outline-offset-[3px]
              [.home-search_&:focus-visible]:rounded-[3px] [.home-search_&[data-empty=true]]:text-muted-text
              [.home-search_&]:max-[900.001px]:min-h-11 [.home-search_&]:max-[900.001px]:text-[16px] [.home-search_&]:max-[900.001px]:px-0.5
              [.home-search_&]:max-[900.001px]:py-0 [.home-search\_\_dates_&]:max-[900.001px]:flex-1
              [.home-search\_\_dates_&]:max-[900.001px]:min-w-0 [.home-search\_\_dates_&]:max-[900.001px]:justify-start"
            placeholder="Add dates"
          />
          <span className="text-muted-text flex-none" aria-hidden="true">
            –
          </span>
          <BookingDatePicker
            id="home-search-check-out"
            min={checkIn ? addDaysIso(checkIn, 1) : addDaysIso(todayIso(), 1)}
            value={checkOut}
            onChange={setCheckOut}
            className="[.home-search_&]:h-auto [.home-search_&]:min-h-0 [.home-search_&]:bg-transparent [.home-search_&]:shadow-none
              [.home-search_&]:text-[15px] [.home-search_&]:text-link [.home-search_&]:justify-start [.home-search_&]:text-left
              [.home-search_&]:p-0 [.home-search_&]:gap-1.5 [.home-search_&]:border-0 [.home-search_&_[data-slot=select-value]]:text-left
              [.home-search_&:hover]:bg-transparent [.home-search_&:hover]:text-link-strong [.home-search_&:hover]:border-0
              [.home-search_&:focus-visible]:[outline:2px_solid_var(--color-link)] [.home-search_&:focus-visible]:outline-offset-[3px]
              [.home-search_&:focus-visible]:rounded-[3px] [.home-search_&[data-empty=true]]:text-muted-text
              [.home-search_&]:max-[900.001px]:min-h-11 [.home-search_&]:max-[900.001px]:text-[16px] [.home-search_&]:max-[900.001px]:px-0.5
              [.home-search_&]:max-[900.001px]:py-0 [.home-search\_\_dates_&]:max-[900.001px]:flex-1
              [.home-search\_\_dates_&]:max-[900.001px]:min-w-0 [.home-search\_\_dates_&]:max-[900.001px]:justify-start"
            placeholder="Add dates"
          />
        </div>
      </div>

      <div className="flex flex-col justify-center min-w-0 border-r border-solid border-r-border px-6 py-4.5 gap-1.5 max-[900.001px]:hidden
        max-[900.001px]:border-r-0 max-[900.001px]:border-b max-[900.001px]:border-solid max-[900.001px]:border-b-border
        max-[900.001px]:px-4.5 max-[900.001px]:py-3 [.home-search[data-expanded=true]_&]:max-[900.001px]:flex">
        <span className="text-[11px] leading-none font-bold tracking-[1px] uppercase text-muted-text" id="home-search-guests-label">
          Guests
        </span>
        <Select value={guests} onValueChange={setGuests}>
          <SelectTrigger
            className="[.home-search_&]:h-auto [.home-search_&]:min-h-0 [.home-search_&]:bg-transparent [.home-search_&]:shadow-none
              [.home-search_&]:text-[15px] [.home-search_&]:text-link [.home-search_&]:justify-start [.home-search_&]:text-left
              [.home-search_&]:p-0 [.home-search_&]:gap-1.5 [.home-search_&]:border-0 [.home-search_&_[data-slot=select-value]]:text-left
              [.home-search_&:hover]:bg-transparent [.home-search_&:hover]:text-link-strong [.home-search_&:hover]:border-0
              [.home-search_&:focus-visible]:[outline:2px_solid_var(--color-link)] [.home-search_&:focus-visible]:outline-offset-[3px]
              [.home-search_&:focus-visible]:rounded-[3px] [.home-search_&[data-empty=true]]:text-muted-text
              [.home-search_&]:max-[900.001px]:min-h-11 [.home-search_&]:max-[900.001px]:text-[16px] [.home-search_&]:max-[900.001px]:px-0.5
              [.home-search_&]:max-[900.001px]:py-0 [.home-search\_\_dates_&]:max-[900.001px]:flex-1
              [.home-search\_\_dates_&]:max-[900.001px]:min-w-0 [.home-search\_\_dates_&]:max-[900.001px]:justify-start"
            aria-labelledby="home-search-guests-label"
            data-empty={guests ? undefined : "true"}
          >
            <SelectValue placeholder="Add guests" />
          </SelectTrigger>
          <SelectContent>
            {guestOptions.map((count) => (
              <SelectItem key={count} value={String(count)}>
                {count} {count === 1 ? "guest" : "guests"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <button type="submit" className="bg-button-bg text-button-text font-heading text-[13px] font-bold tracking-[1.5px] uppercase cursor-pointer
        [transition:background-color_200ms_ease] px-[clamp(28px,_4vw,_52px)] py-0 border-0 hover:bg-[#2b3433]
        focus-visible:[outline:2px_solid_var(--color-link)] focus-visible:outline-offset-[-4px] max-[900.001px]:hidden
        max-[900.001px]:min-h-13 max-[900.001px]:px-6 max-[900.001px]:py-4 [.home-search[data-expanded=true]_&]:max-[900.001px]:block">
        Search
      </button>
    </form>
  );
}
