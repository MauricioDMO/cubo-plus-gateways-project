/*
 * The live theme draws these with Font Awesome (`fa-sign-in-alt`, `fa-plus`,
 * `fa-bars`, plus an X to dismiss the burger overlay). The icon font was never
 * migrated with the theme -- the same gap the homepage's step tiles work around
 * -- so the four glyphs the header needs are redrawn as inline currentColor
 * SVGs. Sized by Tailwind utilities, not by width/height attributes, so one icon can appear at
 * different sizes in the desktop nav and the burger overlay.
 *
 * Plain presentational components with no state, shared by the server-rendered
 * Header and the client-rendered MobileNav.
 */

type IconProps = { className?: string };

const strokeProps: React.SVGProps<SVGSVGElement> = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: "false",
  viewBox: "0 0 24 24",
};

export function PlusIcon({ className = "site-nav__icon size-4 shrink-0" }: IconProps) {
  return (
    <svg className={className} {...strokeProps}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function BurgerIcon({ className = "block size-6" }: IconProps) {
  return (
    <svg className={className} {...strokeProps}>
      <path d="M3 6h18" />
      <path d="M3 12h18" />
      <path d="M3 18h18" />
    </svg>
  );
}

export function CloseIcon({ className = "block size-6" }: IconProps) {
  return (
    <svg className={className} {...strokeProps}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

/*
 * Task 29: Carousel arrow buttons (Top Properties). The live site draws
 * these with Font Awesome too (`fa-arrow-left`/`fa-arrow-right`, confirmed
 * via devtools on the live `.slick-prev`/`.slick-next` elements), so they
 * are redrawn as simple currentColor SVGs like the icons above.
 */

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg className={className} {...strokeProps}>
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg className={className} {...strokeProps}>
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

/*
 * Task 28: verified badge, per-amenity icons, and the decorative card heart.
 *
 * The live site draws all of these with Font Awesome too (confirmed live via
 * devtools on getawayselsalvador.com, same gap as the header icons above):
 * the verified badge is `fas fa-check-circle` (title="Verified", solid green,
 * rgb(67, 130, 79)) rendered as a sibling of the title link/text inside the
 * heading -- both on listing *cards* (`<h4 class="hp-listing__title">`) and on
 * the individual listing page (`<h1 class="hp-listing__title">`). Each
 * amenity row is `<i class="hp-icon fas fa-fw fa-<glyph}"></i>` before the
 * label; the real glyph-per-key pairing (kept here only as a comment, since
 * the icon font itself was never migrated) is: beachaccess=umbrella-beach,
 * elevator=arrow-circle-up, oceanview=street-view, parking=parking,
 * hammocks=smile, gym=skating, firepit=fire, swimmingpool=swimming-pool,
 * wifi=wifi, tv=tv, hotwater=water, airconditioning=air-freshener, bedrooms=bed,
 * bathrooms=bath, check_in=arrow-circle-right, check_out=arrow-circle-left --
 * redrawn below as simple currentColor SVGs since the glyphs themselves
 * aren't available. The favorite heart (`hp-listing__action--favorite`, a
 * disabled `#user_login_modal` link since Fase 1 has no accounts) is
 * `fas fa-heart`, solid; drawn here as an outline instead, since an unfilled
 * heart reads more honestly as "nothing to favorite yet" for a page where the
 * click does nothing at all.
 */

export type AmenityIconKey =
  | "beachaccess"
  | "elevator"
  | "oceanview"
  | "parking"
  | "hammocks"
  | "gym"
  | "firepit"
  | "swimmingpool"
  | "wifi"
  | "tv"
  | "hotwater"
  | "airconditioning"
  | "bedrooms"
  | "bathrooms"
  | "guests"
  | "pets"
  | "check_in"
  | "check_out";

// Unlike every other icon in this file, this one carries real information
// (the listing actually is verified) rather than decorating text a sighted
// user already has -- the live site backs that reading with a literal
// `title="Verified"` tooltip on its own badge. So it is deliberately NOT
// aria-hidden: `role="img"` + an SVG <title> gives it an accessible name
// ("Verified") instead of disappearing from the accessibility tree.
export function VerifiedIcon({ className = "inline-block align-middle size-5 ml-2 text-success [&_path]:stroke-background" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      role="img"
      aria-label="Verified"
      focusable="false"
    >
      <title>Verified</title>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="M7.5 12.5l3 3 6-6.5"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeartIcon({ className = "card-favorite__icon" }: IconProps) {
  return (
    <svg className={className} {...strokeProps}>
      <path d="M12 20.5s-7.5-4.6-10-9.1C.4 8 1.9 4.4 5.4 3.8c2.1-.4 4.2.8 6.6 3.4 2.4-2.6 4.5-3.8 6.6-3.4 3.5.6 5 4.2 3.4 7.6-2.5 4.5-10 9.1-10 9.1z" />
    </svg>
  );
}

export function AmenityIcon({
  type,
  className = "shrink-0 size-4.5 text-[rgba(7,36,86,0.35)]",
}: IconProps & { type: AmenityIconKey }) {
  switch (type) {
    case "beachaccess":
      return (
        <svg className={className} {...strokeProps}>
          <path d="M3 12a9 9 0 0 1 18 0z" />
          <path d="M12 12v8" />
          <path d="M9 20h6" />
        </svg>
      );
    case "elevator":
      return (
        <svg className={className} {...strokeProps}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M9 10l3-3 3 3" />
          <path d="M9 15l3 3 3-3" />
        </svg>
      );
    case "oceanview":
      return (
        <svg className={className} {...strokeProps}>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "parking":
      return (
        <svg className={className} {...strokeProps}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M9.5 16V8H13a2.5 2.5 0 0 1 0 5H9.5" />
        </svg>
      );
    case "hammocks":
      return (
        <svg className={className} {...strokeProps}>
          <path d="M4 3v18" />
          <path d="M20 3v18" />
          <path d="M4 9c3.5 5 12.5 5 16 0" />
        </svg>
      );
    case "gym":
      return (
        <svg className={className} {...strokeProps}>
          <path d="M6 12h12" />
          <rect x="2" y="9" width="4" height="6" rx="1" />
          <rect x="18" y="9" width="4" height="6" rx="1" />
        </svg>
      );
    case "firepit":
      return (
        <svg className={className} {...strokeProps}>
          <path d="M12 2.5c1 3-2 4-1.8 7 .1 1.4 1 2 1.8 2 1.3 0 2-1.2 1.8-2.5 1.7 1.4 2.7 3.6 2.7 5.5a4.5 4.5 0 0 1-9 0c0-4.2 3-8.3 4.5-12z" />
        </svg>
      );
    case "swimmingpool":
      return (
        <svg className={className} {...strokeProps}>
          <path d="M2 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
          <path d="M2 14.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
          <path d="M2 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
        </svg>
      );
    case "wifi":
      return (
        <svg className={className} {...strokeProps}>
          <path d="M2 8.5a16 16 0 0 1 20 0" />
          <path d="M5.5 12.5a11 11 0 0 1 13 0" />
          <path d="M9 16.5a6 6 0 0 1 6 0" />
          <path d="M12 20v.01" />
        </svg>
      );
    case "tv":
      return (
        <svg className={className} {...strokeProps}>
          <rect x="3" y="5" width="18" height="13" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 18v3" />
        </svg>
      );
    case "hotwater":
      return (
        <svg className={className} {...strokeProps}>
          <path d="M12 3c-3 4.5-6 8-6 11a6 6 0 0 0 12 0c0-3-3-6.5-6-11z" />
        </svg>
      );
    case "airconditioning":
      return (
        <svg className={className} {...strokeProps}>
          <path d="M12 2v20" />
          <path d="M4 6.5l16 11" />
          <path d="M20 6.5l-16 11" />
        </svg>
      );
    case "bedrooms":
      return (
        <svg className={className} {...strokeProps}>
          <path d="M3 18v-4a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v1" />
          <path d="M12 14v-2a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v6" />
          <path d="M3 13h18" />
          <path d="M3 18v2" />
          <path d="M21 18v2" />
        </svg>
      );
    case "bathrooms":
      return (
        <svg className={className} {...strokeProps}>
          <path d="M5 12V6a2 2 0 0 1 2-2" />
          <path d="M2 12h20v1a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5v-1z" />
          <path d="M6 18v2" />
          <path d="M18 18v2" />
        </svg>
      );
    // Occupancy, for the capacity line on listing cards. Not part of the
    // migrated HivePress attribute set, so it has no live-site glyph to
    // match -- drawn to sit with the bed/bath pair above it.
    case "guests":
      return (
        <svg className={className} {...strokeProps}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
        </svg>
      );
    case "pets":
      return (
        <svg className={className} {...strokeProps}>
          <circle cx="8" cy="7" r="1.6" />
          <circle cx="12.5" cy="5.5" r="1.6" />
          <circle cx="17" cy="7" r="1.6" />
          <circle cx="19" cy="11.5" r="1.6" />
          <path d="M8 13.5c0-2 2-3.2 4.5-3.2s4.5 1.2 4.5 3.2c0 2.2-1.8 3-4.5 3s-4.5-.8-4.5-3z" />
        </svg>
      );
    case "check_in":
      return (
        <svg className={className} {...strokeProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9 8l4 4-4 4" />
        </svg>
      );
    case "check_out":
      return (
        <svg className={className} {...strokeProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M15 8l-4 4 4 4" />
        </svg>
      );
    default: {
      // Exhaustiveness check: if AmenityIconKey ever gains a member without a
      // matching case above, this line fails to typecheck instead of the
      // switch silently falling through and rendering nothing at runtime.
      const exhaustive: never = type;
      void exhaustive;
      return null;
    }
  }
}
