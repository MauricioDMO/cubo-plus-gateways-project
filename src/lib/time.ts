// HivePress (the WP theme this data was migrated from) stores check-in/
// check-out times as a string of seconds-since-midnight (e.g. "54000" for
// 3:00 pm). Real listing.attributes always carries these as strings, so the
// helper accepts a string and returns just the 12-hour "h:mm am/pm" portion
// -- callers wrap it with "After "/"Before " to match the real site's copy.
export function formatCheckTime(seconds: string): string {
  const totalSeconds = Number(seconds);
  const hours24 = Math.floor(totalSeconds / 3600) % 24;
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const period = hours24 < 12 ? "am" : "pm";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

// Renders a post's `published_at` timestamptz the way the real site's post
// cards and archive do ("August 3, 2026"). Pinned to UTC so the date can never
// shift by a day depending on where it renders (published_at is stored as a
// timestamptz, and the WP dates it came from are wall-clock dates).
// Shared by /blog and the homepage's "From the Blog" teasers (Task 25).
export function formatPublishedDate(publishedAt: string): string {
  return new Date(publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Renders a stay date ("2027-04-10") for a guest or for the admin.
 *
 * A check-in is a wall-clock date, not an instant: the 10th is the 10th
 * whoever is looking. Four copies of this used to parse the string as UTC
 * midnight and then format it in the viewer's zone, which in El Salvador
 * (UTC-6) rolled every single date back a day -- the admin bookings table
 * showed every stay starting the day before it actually does. Pinning the
 * formatter to UTC is what keeps the number that goes in the one that comes
 * out.
 */
export function formatStayDate(
  date: string,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" },
  locale = "en-GB"
): string {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, day))
  );
}

/**
 * en-GB abbreviates September as "Sept" -- the only four-letter short month
 * in the set, and the one that tipped the booking widget's date field onto a
 * second line while every other month sat on one. Everything else in the
 * locale is what this site wants (day before month), so the fix is the four
 * characters, not the locale.
 */
export function trimShortMonth(formatted: string): string {
  // Word-bounded: without it this would turn a long-format "September" into
  // "Sepember".
  return formatted.replace(/\bSept\b/, "Sep");
}

/**
 * Renders a real instant (a message or thread's UTC timestamp, not a
 * wall-clock stay date) for the admin. Pinned to America/El_Salvador for the
 * same reason formatStayDate is pinned to UTC: a client component that calls
 * `new Date(iso).toLocaleString()` with no explicit locale/zone renders
 * differently on the server (Node's default locale/TZ) than in the
 * browser -- a real hydration mismatch caught rendering the admin inbox,
 * not a hypothetical one. Fixing both to the same explicit values makes the
 * server-rendered HTML and the client's first render byte-identical.
 */
export function formatMessageTimestamp(isoDateTime: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/El_Salvador",
  }).format(new Date(isoDateTime));
}
