# Design System: Getaways El Salvador

## 1. Visual Theme & Atmosphere

Getaways El Salvador presents coastal apartment and villa rentals, concierge assistance, and property management. Its homepage combines an airy hospitality brochure with information-dense rental cards.

The recognizable composition is white space, oversized coastal photography, charcoal-green accents, rounded Lexend headings, and restrained interface chrome. **Observed** refers to the public homepage and browser-computed styles; **Inferred** identifies reusable interpretations, not confirmed brand specifications.

- Overall feeling: relaxed, practical, contemporary coastal hospitality rather than ornate luxury.
- Visual density: spacious between sections; compact amenity lists and metadata inside cards.
- Brand posture: local, service-led, and helpful to both guests and property owners.
- Signature motifs: palm-and-island wordmark, aerial shoreline hero, short green rules above section titles, translucent image badges, and pale contour-line decoration.

### Key Characteristics

- Large real-world coastal and architectural photography.
- White surfaces with very soft blue-tinted shadows.
- Charcoal-green pill actions rather than bright tropical UI colors.
- Lexend medium-weight titles paired with Inter body text.
- Centered section introductions above photographic grids and carousels.

## 2. Color Palette & Roles

**Observed:** values below come from computed styles. Semantic names are descriptive labels introduced for this guide. Alpha colors should remain translucent; their appearance depends on the underlying surface.

| Role | Semantic Name | Value | Usage |
| --- | --- | --- | --- |
| Primary action | Coastal charcoal | #394342 | Filled actions, active Home link, hero fallback, section-title rules |
| Background | Page white | #FFFFFF | Main page and navigation canvas |
| Surface | Card white | #FFFFFF | Property, testimonial, blog, and dropdown surfaces |
| Heading text | Deep ink | rgba(15, 23, 39, 0.85) | Headings and card titles |
| Body text | Quiet ink | rgba(15, 23, 39, 0.65) | Paragraphs, navigation, descriptions |
| Muted text | Soft ink | rgba(15, 23, 39, 0.45) | Section subtitles, dates, footer utility links |
| Border | Mist divider | rgba(7, 36, 86, 0.075) | Fine metadata separators |
| Muted icon | Blue-gray icon | rgba(7, 36, 86, 0.35) | Property amenity pictograms |
| Accent | Verified green | #43824F | Verified-property checkmark; not the primary CTA color |
| Utility link | Theme blue | #039BE5 | Computed color on some image/favorite anchors; often their visible child overrides it |
| Image badge | Translucent white | rgba(255, 255, 255, 0.35) | Listing-count and category pills over photography |
| Inverse text | White ink | #FFFFFF | Hero, image cards, and filled actions |
| Inverse action text | Black ink | #000000 | White CONTACT US hero action |

### Primary

- #394342 is the interface's main identifying accent; it is quiet and nearly neutral.
- Ocean, foliage, sand, and sunset colors belong primarily to photography, not a multicolor control palette.

### Interactive

- Active desktop Home link: #394342. Other top-level links: rgba(15, 23, 39, 0.65).
- Primary header button includes `linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,0.2))` over #394342. This is a subtle horizontal lightening, not a separate brand hue.
- Verified green communicates a property status. Do not reuse it as an invented selected/filter state.
- Keyboard focus was inspected on the skip link only; other focus colors are Not observed.

### Neutral Scale

- Heading, body, and supporting text share the same RGB base, with 0.85, 0.65, and 0.45 opacity respectively.
- Borders and muted amenity icons share a different blue-tinted RGB base: 7, 36, 86.
- Pale gray icon tiles and pale warm contour lines are visible; their exact colors are Not observed.

### Surface & Overlay

- Main page surface: #FFFFFF.
- Elevated card and control surface: #FFFFFF.
- Hero overlay: `rgba(0,0,0,0.5)` plus `linear-gradient(to top, rgba(0,0,0,0.25) 0%, rgba(255,255,255,0) 50%)` on a full-cover pseudo-element.
- Category image overlay: `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.5))`.
- Only the light page appearance was observed. The dark photographic hero is not evidence of a dark theme; no theme switch was visible.

### Shadows & Depth

- Card shadow: 0px 5px 30px 0px rgba(7, 36, 86, 0.075)
- Primary action shadow: 0px 5px 21px 0px rgba(57, 67, 66, 0.35)
- White hero action shadow: 0px 5px 21px 0px rgba(255, 255, 255, 0.35)
- Focus treatment: skip link has `1px auto rgb(16,16,16)` outline and `0px 0px 2px 2px rgba(0,0,0,0.6)` shadow when keyboard-focused.

## 3. Typography Rules

**Observed:** the live browser loaded Lexend 500 and Inter 400/500. Headings are rounded and medium-weight; ordinary text is neutral and lighter. Do not reproduce the logo with the heading font: the wordmark is an image asset.

### Font Family

- Primary: Inter, sans-serif.
- Display: Lexend, sans-serif.
- Source fallback stacks: `Inter, "Inter Fallback", sans-serif` and `Lexend, "Lexend Fallback", sans-serif`.
- Monospace: Not observed.
- OpenType Features: Not observed.
- Preview availability: font files are not bundled in these deliverables. The preview may use fallback fonts; its custom-font appearance is not visually verified.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Hero headline | Lexend | 60px | 500 | 75px | normal | Getaways Concierge at inspected desktop widths |
| Hero supporting heading | Lexend | 30px | 500 | 37.5px | normal | Complimentary-call invitation; wraps within the left hero column |
| Section heading | Lexend | 42px | 500 | 52.5px | normal | Centered titles such as Top Categories |
| Intro / category / step heading | Lexend | 25px | 500 | 31.25px | normal | Opening positioning line, image-category titles, booking steps |
| Closing CTA heading | Lexend | 30px | 500 | 37.5px | normal | Rent a Property / Become a Host |
| Card title / testimonial author | Lexend | 21px | 500 | 26.25px | normal | Property and blog titles, guest attribution |
| Footer heading | Lexend | 18px | 500 | 22.5px | normal | Properties, Blog, Social |
| Body | Inter | 16px | 400 | 24px | normal | Default page text and navigation |
| Section subtitle | Inter | 20px | 400 | 37.5px | normal | Muted centered supporting line |
| Testimonial text | Inter | 19.2px | 400 | 28.8px | normal | Longer review passage |
| Category description | Inter | 14px | 400 | 21px | normal | White description over image |
| Amenity text | Inter | 12px | 400 | 18px | normal | Dense two-column property facts |
| Label / Eyebrow | Inter | 11px | 400 | 16.5px | 1px | Uppercase image-category pills |
| Caption / Meta | Inter | 11px | 400 | 16.5px | Not observed | Blog dates and related metadata, displayed uppercase |

### Principles

- Keep Lexend at 500 rather than introducing heavy display weights.
- Use title case for short section headings and ordinary sentence phrasing for descriptions.
- Reserve uppercase and tracked small type for badges and metadata, not all buttons or headings.
- Center section introductions, but left-align card details, hero copy, and review text.

## 4. Component Stylings

### Buttons and Links

**Primary CTA**

- Label: Find a Property
- Background: #394342; subtle white-to-transparent horizontal gradient described above.
- Text: #FFFFFF.
- Radius: 9999px.
- Height: 49.34px.
- Text style: 16px Inter, weight 400, line-height 24px.
- Padding: approximately 12.67px 23.33px, as computed.
- Border: 0px none.
- Shadow: 0px 5px 21px 0px rgba(57, 67, 66, 0.35).

**Secondary CTA**

- Label: CONTACT US
- Background: #FFFFFF.
- Text: #000000.
- Ring: none; no visible ring against the #FFFFFF button surface.
- Radius: 9999px.
- Height: 49.34px.
- Text style: 16px Inter, weight 400, line-height 24px.
- Padding: approximately 12.67px 23.33px, as computed.
- Shadow: 0px 5px 21px 0px rgba(255, 255, 255, 0.35).

**Link Behavior**

- Text links: navigation is un-underlined in its default state. Property titles, category names, and images are links.
- Hover and active feel: Properties reveals its white dropdown on hover. Header button hover was inspected; its charcoal fill and subtle gradient remained present, with no separately established hover-color token.
- Closing Find a Property and List a Property actions use dark pills around 49.34px high, Inter 16px/24px at 400, with approximately 12.67px 23.33px padding.
- Do not normalize the mixed CTA capitalization: the hero reads CONTACT US; property actions use title case.

### Cards and Containers

- Surface style: #FFFFFF
- Radius: 10px
- Border: 0px none
- Shadow or elevation: 0px 5px 30px 0px rgba(7, 36, 86, 0.075)
- Internal spacing: 20px 24px
- Variants: the values above describe property and editorial cards. Category cards are edge-to-edge photographic tiles with inverse text and 28px 32px text padding. Testimonial cards use 15px corners and 64px desktop text-panel padding. Blog metadata has `1px solid rgba(7,36,86,0.075)` above it.
- Property composition: 4:3 photograph, translucent category pill near the image's lower edge, Lexend title, optional verified check, two compact columns of icon-led amenities, then a favorite action in a separated footer area.
- Category composition: upper-left count pill; title and short description anchored toward the bottom over a darkening image gradient. Desktop cards measured 554px wide and approximately 525px high.
- Editorial composition: photo above a white text panel, small category pills on the image, title, then fine-divider-separated date/author/comment metadata. Desktop blog cards measured approximately 358.66px wide.

### Inputs and Interactive Controls

- Input treatment: Not observed on the inspected homepage. Do not derive a form system from its cards.
- Focus behavior: keyboard Tab reveals a Skip to content link at the top-left, with a gray surface, visible outline, and shadow; its measured target is approximately 161px × 49px.
- Selection states: the current Home navigation item is charcoal-green. Other selected, disabled, error, and validation states are Not observed.
- Carousel controls: small white circular left/right arrows sit near the track edges. Their activated states and keyboard operation were Not inspected.
- Sign In and property favorites link to a login-modal fragment. The modal was Not inspected; no account actions were performed.

### Navigation

- Structure: wide palm-and-wordmark logo on the left; Home, About Us, Properties, Blog, Contact Us, and Sign In in one desktop row; List a Property pill at the right.
- Background treatment: white page surface without a prominent enclosing bar or shadow.
- Link style: Inter 16px/24px, regular weight; muted dark text with a darker current-page link.
- Sticky or scroll behavior: sampled header and navbar are `position: static`; no sticky treatment was observed.
- Desktop navbar spacing: 24px 32px padding. The logo shrinks with the available desktop row space rather than acting as a small app icon; it measured approximately 359px × 75px at a 1440px viewport.
- Header action variant: List a Property uses a 42px height, 9px 28px padding, Inter 500 at 16px/24px, and the same charcoal-green pill treatment. The primary CTA block above represents the larger closing guest action.
- Properties dropdown: Villas and Apartments; white surface, 5px radius, 16px 0px padding, and the shared soft card shadow.
- Footer: wordmark and management descriptor, followed by Properties, Blog, and Social columns; fine separators and a lower utility-navigation row. It remains light, not a dark footer block.

### Image Treatment

- Screenshot treatment: Not observed; this is a photography-led site, not a software-product screenshot layout.
- Photography or illustration style: real aerial shoreline views, bright furnished interiors, pools, ocean-facing balconies, surf, waterfalls, and local activities. Natural blue/green/wood tones provide most of the visual color.
- Border and radius treatment: cover-cropped photographs are clipped by rounded cards; the panoramic hero has 15px corners and dark text-legibility overlays.
- Hero source: https://getawayselsalvador.com/wp-content/uploads/2026/01/cropped-DJI_0151.jpg ; live CSS uses a WordPress image-CDN rendition, centered with `background-size: cover`.
- Logo source: https://getawayselsalvador.com/wp-content/uploads/2026/02/cropped-logo-gw-web.png . Reuse only with appropriate rights; do not approximate the brand mark in ordinary text.
- Icons: live Font Awesome 5 Free glyphs for amenities and account utilities; larger outlined house/chat/calendar/key motifs in pale rounded tiles for explanatory steps. Brand/social icon font was declared but not confirmed loaded.
- Pale contour-line decorations flank the booking-steps section. A large, faint quotation-mark asset decorates testimonial text panels. Exact decorative colors and icon-tile dimensions are Not observed.

### Distinctive Components

- Section introduction: centered 50px × 5px charcoal-green pill rule, 16px of heading top padding, a Lexend title, then a muted subtitle. The rule carries the same subtle horizontal lightening as the primary action.
- Three-step explainer: Find a Property, Check Reviews, Book a Stay; evenly spaced icons with tiny 01/02/03 corner labels and centered headings on a largely white background.
- Property carousel: three prominent cards across the desktop view, neighboring content clipped at track edges, circular previous/next controls, and denser amenity details than the surrounding marketing sections.
- Testimonial carousel: wide split card, photographic panel on the left and text/attribution on the right; adjacent cards partially visible. A sampled desktop card measured 1140px × 446.75px with equal-width panels.
- Closing guest/host split: two centered columns with icon tile, short heading, and dark pill action; generous empty space rather than a colored conversion banner.

## 5. Layout Principles

### Spacing System

- Base unit: Not observed as an authored token. Inferred: a predominantly 8px-family rhythm, with 4px detail spacing and several optical exceptions.
- Repeated spacing values: 4px, 8px, 16px, 20px, 24px, 28px, 32px, 40px, 64px.
- Hero vertical padding: 144px at the inspected desktop sizes.
- Keep context-specific values: 20px 24px card padding, 28px 32px category padding, and 64px testimonial padding should not be collapsed into a single universal inset.

### Grid & Container

- Grid logic: centered content rail; two category columns, three explainer columns, three blog columns, and two closing CTA columns. Property/testimonial tracks extend beyond the regular rail.
- Max content width: observed principal inner rail is 1140px at both 1440px and 1920px viewport widths. A `.container` includes 32px horizontal padding, giving a measured outer width of 1204px.
- Section spacing: sampled wide explainer block has 32px top and 64px bottom margins; section titles have 32px vertical margins, subtitles have a -24px top adjustment and 40px bottom margin. Other section-specific spacers vary; a universal section gap is Not observed.
- Desktop grid gutters: 32px between the two category columns and the three editorial columns; grid items have 16px side padding.
- Hero width: nearly viewport-wide with 32px side margins; measured approximately 1361px wide at the 1440px viewport after the browser scrollbar. Content aligns to the centered rail, not to the hero's outer edge.
- Hero copy: left column occupies 60% of the 1140px inner rail, measured 684px. Leave the right-hand view open to the coastline.

### Whitespace Philosophy

- Whitespace philosophy: use quiet gaps and readable section introductions to separate functional groups; do not fill every interval with boxes or colored bands.
- Alignment tendencies: centered introductions and process/CTA groups; left-aligned photographic captions and detailed information.
- Content width behavior: the central rail stays constrained on wide screens while the hero and carousel compositions reach outward.
- Homepage order: navigation → concierge hero → positioning sentence → categories → three booking steps → properties → testimonials → blog → guest/host actions → footer.

### Border Radius Scale

- Micro: 5px for the desktop navigation dropdown.
- Standard: 10px for category, listing, and blog cards.
- Large: 15px for hero, wide explainer cover, and testimonial cards.
- Pill: 9999px for actions, badges, and section-title rules.
- Icon-tile corner radius: Not observed numerically; visibly softer and rounder than ordinary card corners.

## 6. Depth & Elevation

| Level | Treatment | Use |
| --- | --- | --- |
| Flat | #FFFFFF, no enclosing shadow | Page, navbar, process section, footer |
| Divider | 1px solid rgba(7, 36, 86, 0.075) | Metadata separators |
| Card | 0px 5px 30px 0px rgba(7, 36, 86, 0.075) | Property, blog, testimonial, dropdown |
| Action | 0px 5px 21px 0px rgba(57, 67, 66, 0.35) | Dark pill buttons |
| Inverse action | 0px 5px 21px 0px rgba(255, 255, 255, 0.35) | White hero CTA |
| Focus | 1px auto outline plus 0px 0px 2px 2px rgba(0, 0, 0, 0.6) | Observed skip-link keyboard focus only |

### Depth Principles

- Surface hierarchy: white canvas and white cards are distinguished by shadow, photography, and spacing rather than gray panels everywhere.
- Shadow language: diffuse, low-opacity, slightly blue-tinted card shadows; darker color-matched shadows beneath green actions.
- Blur, glass, or overlay behavior: translucent image badges and dark photo gradients are observed. Backdrop blur and glass panels are Not observed.
- When depth is used versus avoided: raised content cards and actions sit within mostly flat section layouts. Inferred: elevation supports clickable or grouped content without making the entire page look like a dashboard.

## 7. Do's and Don'ts

### Do

- Preserve the restrained green/white/ink UI and let real photography supply the richer coastal colors.
- Pair medium Lexend headings with regular Inter text; retain the small uppercase badge tier.
- Use the short centered title rule and quiet subtitles to create repeated section rhythm.
- Keep the open page composition and compact property information as intentionally different densities.
- Retain text labels with amenity icons and visible keyboard focus in new implementations.

### Don't

- Replace the source's palette with bright teal controls or add unrelated gradients.
- Turn all surfaces into bordered panels or replace subtle shadows with heavy elevation.
- Use the Lexend font as a substitute for the supplied brand wordmark.
- Invent prices, ratings, testimonials, booking guarantees, or property verification claims.
- Treat uninspected mobile layouts, forms, modal states, or theme variants as established rules.

## 8. Responsive Behavior

### Breakpoints

The widths below are inspection samples, **not confirmed CSS breakpoint boundaries**.

| Name | Width | Key Changes |
| --- | --- | --- |
| Wide desktop | 1920px | Full horizontal navigation; 1140px content rail; wide hero and carousel tracks; two category columns and three blog columns |
| Desktop | 1440px | Same section/grid model and measured typography; navbar logo shrinks within available row space; property cards measured approximately 415px wide after carousel resize settled |
| Mobile attempt | 390px | Site returned a human-verification page before the mobile design could be inspected; responsive navigation, typography, and stacking are Not observed |
| Tablet | Not inspected | No tablet layout observations |

### Touch Targets

- Observed desktop header action height: 42px; hero and closing actions: approximately 49.34px.
- Mobile tap-target sizes, menu controls, swipe behavior, and spacing adjustments are Not observed.
- Amenity icons are informational, not standalone button targets. Carousel arrow accessibility was Not inspected.

### Collapsing Strategy

- Desktop behavior: keep the principal content rail centered; shrink available logo space; preserve multi-column sections at the observed widths.
- Tablet behavior: Not observed.
- Mobile behavior: Not observed; do not assume a hamburger menu or a particular stacking order is verified by this reference.
- Breakpoint-driven component changes: exact rules are Not established by the inspected viewport samples.
- Touch target and spacing adjustments: Not observed. Any adaptations made in a future build should be labeled implementation decisions and validated separately.

## 9. Agent Prompt Guide

### Quick Color Reference

- Primary CTA: #394342.
- Background: #FFFFFF.
- Heading text: rgba(15, 23, 39, 0.85).
- Body text: rgba(15, 23, 39, 0.65).
- Border or ring: rgba(7, 36, 86, 0.075).
- Accent: #394342 for brand/action emphasis; #43824F only for observed verification status.

### Quick Summary

Build an airy, photography-led coastal hospitality interface on white.
Use Lexend 500 headings and Inter 400/500 supporting text.
Anchor interface color in #394342, translucent deep ink, and soft blue-gray separators.
Constrain desktop content to a 1140px rail, with wider panoramic hero and carousel treatments.
Use 10px cards, 15px large compositions, pill actions, and diffuse low-opacity shadows.
Center section introductions with a 50px × 5px accent rule; keep card detail left-aligned.
Mobile and tablet treatments require separate design decisions because access was incomplete.

### Example Component Prompts

- Hero: Create a near-full-width aerial coastline hero inset 32px from desktop edges, with 15px corners, center/cover photography, a 50% black overlay and subtle lower darkening. Align a 684px copy column to a 1140px inner rail. Use Lexend 500 at 60px/75px for the headline, 30px/37.5px for the invitation, and a white CONTACT US pill around 49px tall. Preserve ample open coastline to the right; do not add a search form.
- Card: Create a white rental card with 10px corners and a 0px 5px 30px rgba(7,36,86,0.075) shadow. Place a 4:3 interior photo above 20px 24px padded content. Add a translucent uppercase category pill, Lexend 21px title, and two compact columns of Inter 12px amenities with muted blue-gray icons. Include verified status only if supplied by real data.
- Navigation: Build a white desktop navigation row with a prominent supplied palm-and-wordmark image, regular 16px Inter links, darker current-page text, and a 42px-high charcoal-green List a Property pill. On Properties hover, show a white Villas/Apartments dropdown with 5px corners and the shared soft shadow. Do not invent a confirmed mobile navigation model.
- Section introduction: Center a 50px × 5px green pill rule over a Lexend 500 heading at 42px/52.5px; follow it with a muted Inter 20px subtitle at 37.5px line-height. Place two photo-led category cards below, using count badges and bottom-aligned white captions over darkening gradients.

### Ready-to-Use Prompt

Use this guide to extend the observed Getaways El Salvador homepage language: airy white hospitality layouts, coastal/architectural photography, #394342 pill actions, Lexend 500 titles, Inter supporting text, short centered section rules, soft blue-tinted card shadows, 10px/15px corner tiers, and a 1140px desktop content rail. Preserve the distinction between open marketing sections and dense rental amenities. Use only supplied product facts and authorized assets. Do not invent reference-backed mobile, tablet, form, login, or dark-theme behavior; label new adaptations as implementation choices.

### Iteration Guide

1. Match composition, photography, type pairing, and restrained action color before polishing details.
2. Match section-title rules, pill geometry, insets, and compact amenity typography next.
3. Validate any new responsive and interactive states independently; they are not covered by the desktop evidence alone.

## Optional Appendix: Interaction Patterns

- Scroll behavior: ordinary vertical homepage flow; header computed as static. No scroll-triggered animation system was established.
- Hover behavior: Properties dropdown opens on pointer hover. Category imagery and property cards declare `transform 0.25s` transitions; image badges declare `color 0.25s, background-color 0.25s`. Their transformed endpoints were Not inspected.
- Click behavior: card images/titles link to property/category pages; CONTACT US links to the contact page. Navigation destinations were identified without submitting forms or performing account actions.
- Animation tone: sampled transitions are short and localized. Carousel activation, autoplay, transition easing, and reduced-motion behavior are Not inspected.

## Optional Appendix: Content & Messaging Patterns

- Headline pattern: short functional titles—Top Categories, Get started, Top Properties, What People Say, From the Blog—paired with one-line explanatory subtitles.
- CTA language: CONTACT US, Find a Property, List a Property; direct actions rather than playful slogans.
- Feature naming: descriptive property names followed by bed/bath shorthand and location, such as the observed Zonte Surfside Getaway listing title.
- Trust signal pattern: attributed guest feedback, an occasional verified-property check, visible amenities, and photography of actual accommodation. Do not manufacture counts or review claims.
- Voice and tone: warm, concise, specific to El Zonte/Surf City, and service-oriented; copy emphasizes quality, comfort, setting, and complimentary concierge help.

## Optional Appendix: Observed Pages

Inspection date: October 14, 2026. No authenticated areas were accessed.

| URL | Inspected widths | Scope and limitations |
| --- | --- | --- |
| https://getawayselsalvador.com/ | 1920px and 1440px desktop; 390px mobile attempted | Full-page desktop screenshot, accessibility tree, computed styles, navigation dropdown hover, header/hero action hover, and keyboard skip-link focus. At 390px the site returned a browser check followed by a human-verification checkbox; the site's mobile layout was not accessible and the check was not completed. Tablet, linked pages, forms, login, favorites, bookings, carousel activation, dark mode, and reduced motion were Not inspected. |

## Optional Appendix: Evidence Notes

- Observed: homepage identity, desktop composition and typography, loaded source fonts, the listed computed colors/dimensions/shadows, photographic overlays, dropdown expansion, and skip-link keyboard visibility. The two desktop widths retain the same main grid model.
- Inferred: semantic token names, an approximately 8px-family spacing rhythm, the hospitality interpretation, and reusable design rationale. Repetition within one homepage does not establish a whole-product design system.
- Not inspected: responsive site content below desktop widths, tablet, additional public pages, modal/form/error/disabled states, functional booking flows, carousel behavior, reduced motion, and alternative themes.
- Preview limitations: DESIGN-preview.html is generated from this Markdown using the skill's stable renderer. It is a design board, not a clone. Its shell uses bounded demonstration sizes and presentation defaults; action samples can simplify gradients, and custom font files and source photography are not embedded. Those presentation choices are not additional observations about the website.
