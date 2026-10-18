"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bike,
  Car,
  CarTaxiFront,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  Droplets,
  Map,
  MapPin,
  Mountain,
  PhoneCall,
  Plane,
  ShieldCheck,
  Ship,
  ShoppingBasket,
  Sparkles,
  Trees,
  Turtle,
  Utensils,
  Waves,
} from "lucide-react";

import BookingDatePicker from "@/components/molecules/BookingDatePicker";
import PhoneNumberField from "@/components/molecules/PhoneNumberField";
import { Button } from "@/components/atoms/ui/button";
import { Input } from "@/components/atoms/ui/input";
import { Label } from "@/components/atoms/ui/label";
import { Textarea } from "@/components/atoms/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/ui/select";
import { todayIso } from "@/modules/bookings/booking-dates";
import {
  conciergeMailto,
  CONCIERGE_SERVICE_DETAILS,
  CONCIERGE_SERVICE_GROUPS,
  CONCIERGE_SERVICE_LABELS,
  type ConciergeServiceIconKey,
  type ConciergeService,
} from "@/modules/concierge/concierge-shared";

/*
 * The concierge request form.
 *
 * Two things it does that the booking form does not. It has a success state,
 * because nothing redirects afterwards -- the guest stays here and has to be
 * told the request arrived. And it has a fallback: if the server answers
 * "store_unavailable" (the migration has not been applied yet) it opens a
 * pre-filled email rather than reporting a failure, so the request still
 * reaches somebody.
 *
 * Native checkboxes rather than a shadcn one: components/atoms/ui has no checkbox,
 * and adding it means a new Radix dependency for three tick boxes.
 */

type Props = {
  /** Prefilled from ?listing= on the page, so a request from a property page arrives with context. */
  listingSlug?: string;
  listingTitle?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialServices?: ConciergeService[];
  /** Where the fallback email goes. Passed in so the address lives in modules/site/business.ts only. */
  fallbackEmail: string;
};

const CALL_WINDOWS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
];

const SERVICE_ICONS: Record<ConciergeServiceIconKey, typeof Plane> = {
  plane: Plane,
  car: Car,
  chef: ChefHat,
  utensils: Utensils,
  map: Map,
  boat: Ship,
  water: Droplets,
  turtle: Turtle,
  waves: Waves,
  mountain: Mountain,
  bike: Bike,
  horse: Trees,
  steering: CarTaxiFront,
  basket: ShoppingBasket,
};

function tripDates(checkIn?: string, checkOut?: string) {
  if (!checkIn && !checkOut) return null;
  const format = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      ...(checkIn && checkOut && checkIn.slice(0, 4) === checkOut.slice(0, 4) ? {} : { year: "numeric" }),
    }).format(new Date(year, month - 1, day));
  };
  if (checkIn && checkOut) {
    return `${format(checkIn)} – ${format(checkOut)}${checkIn.slice(0, 4) === checkOut.slice(0, 4) ? ` ${checkOut.slice(0, 4)}` : ""}`;
  }
  return format((checkIn ?? checkOut)!);
}

export default function ConciergeForm({
  listingSlug,
  listingTitle,
  initialCheckIn,
  initialCheckOut,
  initialServices = [],
  fallbackEmail,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [services, setServices] = useState<ConciergeService[]>(
    initialServices.includes("plan_everything") ? ["plan_everything"] : initialServices
  );
  const [checkIn, setCheckIn] = useState(initialCheckIn ?? "");
  const [checkOut, setCheckOut] = useState(initialCheckOut ?? "");
  const [guests, setGuests] = useState("");
  const [callDay, setCallDay] = useState("");
  const [callWindow, setCallWindow] = useState("");
  const [wantsCall, setWantsCall] = useState(false);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<"stored" | "email" | null>(null);

  /** Option 1 and Option 2 are exclusive; this is which one is showing. */
  const planEverything = services.includes("plan_everything");

  const details = useRef<HTMLDivElement | null>(null);
  const hadSelection = useRef(services.length > 0);

  /*
   * Bring the fields into view on the first pick.
   *
   * The fields render after the whole picker, so from the top of a group a
   * guest could tick a service and have the next step appear a screen and a
   * half below the fold -- nothing on screen changed, so nothing appeared to
   * happen. Only on the transition from no selection to one: after that the
   * panel is already there and moving the page under a guest who is adding a
   * second service would be its own bug.
   */
  useEffect(() => {
    const has = services.length > 0;
    const first = has && !hadSelection.current;
    hadSelection.current = has;
    if (!first) return;

    const panel = details.current;
    if (!panel) return;
    const box = panel.getBoundingClientRect();
    // Already on screen: leave the page where the guest put it.
    if (box.top >= 0 && box.top < window.innerHeight - 80) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /*
     * Its own top, 100px down to clear the header -- not
     * scrollIntoView({block: "center"}), which was tried and put the top of
     * the panel 248px ABOVE the viewport, because the panel is a whole form
     * and taller than the screen it was being centred in.
     */
    const target = window.scrollY + box.top - 100;
    const from = window.scrollY;
    window.scrollTo({ top: target, behavior: reduced ? "auto" : "smooth" });

    /*
     * The hard fallback this codebase carries wherever a scroll matters: a
     * smooth programmatic scroll returns without error and moves nothing in
     * some engines. Measured here too -- 1px of travel where 1400 was asked
     * for -- so if nothing has happened shortly after, go there anyway.
     */
    window.setTimeout(() => {
      if (Math.abs(window.scrollY - from) < 4) window.scrollTo(0, target);
    }, 450);
  }, [services]);

  function toggleService(service: ConciergeService) {
    setServices((current) => {
      if (service === "plan_everything") {
        return current.includes(service) ? [] : ["plan_everything"];
      }
      const withoutEverything = current.filter((chosen) => chosen !== "plan_everything");
      return withoutEverything.includes(service)
        ? withoutEverything.filter((chosen) => chosen !== service)
        : [...withoutEverything, service];
    });
  }

  /** Everything the guest typed, as an email they can send themselves. */
  function openFallbackEmail() {
    window.location.assign(
      conciergeMailto(fallbackEmail, {
        name,
        email,
        phone,
        listingTitle,
        listingSlug,
        services,
        checkIn,
        checkOut,
        guests,
        callDay: wantsCall ? callDay : undefined,
        callWindow: wantsCall ? callWindow : undefined,
        message,
      })
    );
  }

  /* The student copy stores nothing: the request goes out as an email the guest sends. */
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSent("email");
    openFallbackEmail();
  }

  if (sent === "stored") {
    return (
      <div className="concierge-form concierge-form--done" role="status">
        <CheckCircle2 size={22} aria-hidden="true" />
        <h3>Got it, {name.split(" ")[0] || "thanks"}.</h3>
        <p>
          We will write back to {email} to sort out the details. If it is urgent, reach us at{" "}
          <a href={`mailto:${fallbackEmail}`}>{fallbackEmail}</a>.
        </p>
      </div>
    );
  }

  if (sent === "email") {
    return (
      <div className="concierge-form concierge-form--done" role="status">
        <CheckCircle2 size={22} aria-hidden="true" />
        <h3>Almost there</h3>
        <p>
          Your email app should be opening with everything filled in — send it and we will take it
          from there. If nothing opened, write to{" "}
          <a href={`mailto:${fallbackEmail}`}>{fallbackEmail}</a>.
        </p>
      </div>
    );
  }

  return (
    <form className="concierge-form" onSubmit={submit}>
      <fieldset className="concierge-services">
        <legend className="concierge-services__legend">What would make your stay easier?</legend>
        <p className="concierge-services__intro">Two ways to start. Both reach the same team.</p>

        {/* Option 1 first.

            It used to sit under the four groups, as a catch-all for anyone
            whose plan was not on the list -- which put the simplest answer
            last, after a phone-length scroll through sixteen services. The two
            are already mutually exclusive in the state below: choosing this
            clears the rest, and choosing any service clears this. So they are
            two options, and they are labelled as two options. */}
        <div className="concierge-services__paths">
          <p className="concierge-services__option">Option 1</p>
          <label className={`concierge-services__path concierge-services__path--everything${services.includes("plan_everything") ? " concierge-services__path--on" : ""}`}>
            <input
              type="checkbox"
              name="services"
              value="plan_everything"
              checked={services.includes("plan_everything")}
              onChange={() => toggleService("plan_everything")}
            />
            <Sparkles size={22} aria-hidden="true" />
            {/* The card splits what CONCIERGE_SERVICE_LABELS keeps on one
                line. That label -- "Customize a full experience - we plan
                everything" -- is what a summary, an email and the admin show,
                where it has to stand alone; as a card title it would wrap to
                two lines and say the same thing twice. */}
            <span>
              <strong>Customize a full experience</strong>
              <small>We plan everything. Tell us the shape of the trip and we connect the rest.</small>
            </span>
          </label>
        </div>

        {/*
          Option 2 is not on screen while Option 1 is chosen.

          The two are exclusive in the state -- ticking this card clears every
          service, and ticking a service clears this card -- so the sixteen
          services below were sixteen things that would undo the choice just
          made. Worse, the form's fields render after this fieldset: with the
          whole list still in the way, ticking the card at the top of the page
          put the next step some two thousand pixels below the fold, and the
          page looked like nothing had happened.

          Unticking the card brings the list straight back.
        */}
        {planEverything ? (
          <p className="concierge-services__swap">
            Option 2 is the other way round: untick the card above to pick services one by one.
          </p>
        ) : (
        <>
        <p className="concierge-services__option concierge-services__option--second">Option 2</p>
        <h3 className="concierge-services__pick-title">Choose a few of your interests</h3>
        <p className="concierge-services__pick-note">One or as many as you need. We arrange those and leave the rest of the week alone.</p>
        <div className="concierge-services__groups">
          {/* Both ends of the labelling below read `group.id`. They used to
              disagree: the heading carried an id built from the group's own
              identifier while the section pointed at one built by lowercasing
              the label, so "Food & Drinks" pointed at "services-food & drinks"
              and labelled nothing at all. */}
          {CONCIERGE_SERVICE_GROUPS.map((group) => (
            <section
              className="concierge-services__group"
              key={group.id}
              aria-labelledby={`services-${group.id}`}
            >
              <h4 id={`services-${group.id}`}>{group.label}</h4>
              <div className="concierge-services__list">
                {group.services.map((service) => {
                  const Icon = SERVICE_ICONS[CONCIERGE_SERVICE_DETAILS[service].icon];
                  return (
                    <label
                      key={service}
                      className={`concierge-services__choice${services.includes(service) ? " concierge-services__choice--on" : ""}`}
                    >
                      <input
                        type="checkbox"
                        name="services"
                        value={service}
                        checked={services.includes(service)}
                        onChange={() => toggleService(service)}
                      />
                      <Icon size={21} strokeWidth={1.7} aria-hidden="true" />
                      <span>
                        <strong>{CONCIERGE_SERVICE_LABELS[service]}</strong>
                        <small>{CONCIERGE_SERVICE_DETAILS[service].description}</small>
                      </span>
                      <CheckCircle2 className="concierge-services__check" size={19} aria-hidden="true" />
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        </>
        )}
      </fieldset>

      {/*
        Something at the foot of the picker while nothing is chosen.

        The form's fields only appear once a service is ticked, so a guest who
        reads the whole list and picks nothing reached the end of the page at
        "Horseback riding" -- no close, no next step, no way out but the back
        button. This says what a tick leads to, and offers the human path for
        anyone who would rather write than choose from a list.
      */}
      {services.length === 0 && (
        <div className="concierge-form__nudge">
          <p>
            <strong>Pick anything above and we take it from there.</strong>
          </p>
          <p>
            We will ask for your dates and how to reach you — nothing else. Rather talk it through?
            Write to <a href={`mailto:${fallbackEmail}`}>{fallbackEmail}</a> and tell us what you
            have in mind.
          </p>
        </div>
      )}

      {services.length > 0 && (
        <div className="concierge-form__details" ref={details}>
          <div className="concierge-form__selection" aria-live="polite">
            <p>
              <Waves size={18} aria-hidden="true" />
              <span>Selected: {services.map((service) => CONCIERGE_SERVICE_LABELS[service]).join(", ")}</span>
            </p>
            <div className="concierge-form__context">
              <span>
                <MapPin size={13} aria-hidden="true" />
                El Salvador
              </span>
              {listingTitle && <span>{listingTitle}</span>}
              {tripDates(checkIn, checkOut) && <span>{tripDates(checkIn, checkOut)}</span>}
            </div>
          </div>

          <div className="concierge-form__details-intro">
            <h3>Your trip details</h3>
            <p>A few details help us arrange the right people and timing.</p>
          </div>

          <div className="concierge-form__row">
            <div className="concierge-form__field">
              <Label htmlFor="concierge-name">Name</Label>
              <Input
                id="concierge-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                placeholder="Your full name"
                maxLength={120}
                required
              />
            </div>
            <div className="concierge-form__field">
              <Label htmlFor="concierge-email">Email</Label>
              <Input
                id="concierge-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                maxLength={200}
                required
              />
            </div>
          </div>

          <div className="concierge-form__row">
            <div className="concierge-form__field">
              <Label htmlFor="concierge-phone">Phone (optional)</Label>
              <PhoneNumberField id="concierge-phone" value={phone} onChange={setPhone} />
            </div>
            <div className="concierge-form__field">
              <Label htmlFor="concierge-guests">Guests (optional)</Label>
              <Select value={guests} onValueChange={setGuests}>
                <SelectTrigger id="concierge-guests">
                  <SelectValue placeholder="How many of you?" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, index) => String(index + 1)).map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="concierge-form__row">
            <div className="concierge-form__field">
              <Label htmlFor="concierge-check-in">Arriving (optional)</Label>
              <BookingDatePicker
                id="concierge-check-in"
                min={todayIso()}
                value={checkIn}
                onChange={setCheckIn}
                placeholder="Add a date"
              />
            </div>
            <div className="concierge-form__field">
              <Label htmlFor="concierge-check-out">Leaving (optional)</Label>
              <BookingDatePicker
                id="concierge-check-out"
                min={checkIn || todayIso()}
                value={checkOut}
                onChange={setCheckOut}
                placeholder="Add a date"
              />
            </div>
          </div>

          <div className="concierge-form__field">
            <Label htmlFor="concierge-message">Notes (optional)</Label>
            <Textarea
              id="concierge-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Flight times, celebrations, must-see places, or anything useful."
            />
          </div>

          <div className="concierge-form__call">
            <button
              type="button"
              className="concierge-form__call-toggle"
              aria-expanded={wantsCall}
              aria-controls="concierge-call-fields"
              onClick={() => setWantsCall((current) => !current)}
            >
              <span className="concierge-form__call-copy">
                <PhoneCall size={19} aria-hidden="true" />
                <span>
                  <strong>Prefer a call?</strong>
                  <small>{wantsCall ? "Hide call options" : "Choose a day and time"}</small>
                </span>
              </span>
              <ChevronDown
                className={wantsCall ? "concierge-form__call-chevron concierge-form__call-chevron--open" : "concierge-form__call-chevron"}
                size={18}
                aria-hidden="true"
              />
            </button>
            {wantsCall && (
              <div className="concierge-form__row" id="concierge-call-fields">
                <div className="concierge-form__field">
                  <Label htmlFor="concierge-call-day">Preferred call day</Label>
                  <BookingDatePicker
                    id="concierge-call-day"
                    min={todayIso()}
                    value={callDay}
                    onChange={setCallDay}
                    placeholder="Any day"
                  />
                </div>
                <div className="concierge-form__field">
                  <Label htmlFor="concierge-call-window">Preferred call time</Label>
                  <Select value={callWindow} onValueChange={setCallWindow}>
                    <SelectTrigger id="concierge-call-window">
                      <SelectValue placeholder="Any time" />
                    </SelectTrigger>
                    <SelectContent>
                      {CALL_WINDOWS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="concierge-form__status" aria-live="polite">
            {error && (
              <p className="concierge-form__error" role="alert">
                <AlertCircle size={15} aria-hidden="true" />
                <span>{error}</span>
              </p>
            )}
          </div>

          <div className="concierge-form__footer">
            <Button type="submit" className="concierge-form__submit">
              Send my request
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
            <p className="concierge-form__reassurance">
              <ShieldCheck size={17} aria-hidden="true" />
              No commitment. We’ll reply personally.
            </p>
          </div>
        </div>
      )}

      {/* The honeypot. Hidden from people, filled in by bots. */}
      <div className="concierge-form__trap" aria-hidden="true">
        <label htmlFor="concierge-website">Website</label>
        <input
          id="concierge-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

    </form>
  );
}
