import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import PhotoTour, { type TourGroup } from "@/components/organisms/PhotoTour";

/*
 * What can be tested here is the SERVER render, which is the half that
 * matters most: every photograph has to be in the HTML, reachable and
 * described, before any JavaScript runs.
 *
 * What the viewer DOES once it opens is tested next door, in
 * PhotoTourRoom.test.tsx, which runs under jsdom.
 */

const groups: TourGroup[] = [
  {
    label: "Living area",
    media: [
      { id: 11, storage_path: "living-room.jpg", alt_text: "Sunlit living room facing the ocean" },
      { id: 12, storage_path: "terrace.jpg", alt_text: null },
    ],
  },
  {
    // The common case: most rooms in this catalogue hold exactly one.
    label: "Bedrooms",
    media: [{ id: 21, storage_path: "bedroom.jpg", alt_text: "King bedroom with woven headboard", width: 600, height: 900 }],
  },
];

describe("PhotoTour", () => {
  it("renders every room and photograph in one continuous inline tour", () => {
    const html = renderToStaticMarkup(<PhotoTour groups={groups} title="Casa Brisa" />);

    expect(html).toContain('class="photo-tour-section" id="photos"');
    /* Named twice on purpose: the visible heading is what a phone needs above
       the room links, and the aria-label is what a screen reader announces for
       the region itself. */
    expect(html).toContain('aria-label="Photo tour"');
    expect(html).toContain('<h2 class="photo-tour-section__title">Photo tour</h2>');
    // The photo count stays gone -- it was taken off the mobile opener too.
    expect(html).not.toContain("photos, room by room");
    expect(html).toContain('id="tour-living-area"');
    expect(html).toContain('id="tour-bedrooms"');
    expect(html).toContain(">Living area</h3>");
    expect(html).toContain(">Bedrooms</h3>");
    expect(html.match(/<figure/g)).toHaveLength(3);
    expect(html.match(/<img/g)).toHaveLength(3);
  });

  it("keeps the room links as anchors that need no JavaScript", () => {
    const html = renderToStaticMarkup(<PhotoTour groups={groups} title="Casa Brisa" />);

    expect(html).toContain('<nav class="photo-tour-section__rooms" aria-label="Jump to a room">');
    expect(html).toContain('href="#tour-living-area"');
    expect(html).toContain('href="#tour-bedrooms"');
  });

  it("makes every photograph a link to itself, so it works before hydration", () => {
    /*
     * The link is the point: pressed before this island hydrates, or with no
     * JavaScript at all, it still opens the photograph. A button there would
     * be inert for the first few hundred milliseconds of every page load.
     */
    const html = renderToStaticMarkup(<PhotoTour groups={groups} title="Casa Brisa" />);

    // The href, not the filename in it: with no Supabase URL configured --
    // which is the case in this suite -- mediaPublicUrl returns a placeholder,
    // and a test that asserted the path would be testing the environment.
    expect(html.match(/class="photo-tour__open" href="/g)).toHaveLength(3);
    expect(html.match(/aria-haspopup="dialog"/g)).toHaveLength(3);
    expect(html).toContain('aria-label="View larger: Sunlit living room facing the ocean"');
    // The photograph with no alt text of its own falls back to the property
    // and the room, in the label as well as in the alt.
    expect(html).toContain('aria-label="View larger: Casa Brisa, Living area"');
  });

  it("does not render the viewer until something is pressed", () => {
    // The dialog is portalled on open. Shipping one in the server HTML would
    // put a fixed overlay over the page for anyone whose JavaScript is slow.
    const html = renderToStaticMarkup(<PhotoTour groups={groups} title="Casa Brisa" />);

    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain("photo-viewer");
  });

  it("lazy-loads tour images and exposes useful alt text and captions", () => {
    const html = renderToStaticMarkup(<PhotoTour groups={groups} title="Casa Brisa" />);

    expect(html.match(/loading="lazy"/g)).toHaveLength(3);
    expect(html).toContain('alt="Sunlit living room facing the ocean"');
    expect(html).toContain(">Sunlit living room facing the ocean</figcaption>");
    expect(html).toContain('alt="Casa Brisa, Living area"');
    expect(html).not.toContain(">Casa Brisa, Living area</figcaption>");
  });

  it("renders a room that holds a single photograph", () => {
    const html = renderToStaticMarkup(
      <PhotoTour groups={[groups[1]]} title="Casa Brisa" />
    );

    expect(html.match(/class="photo-tour__open"/g)).toHaveLength(1);
    expect(html).toContain('width="600" height="900"');
    expect(html).toContain("/_next/image?");
    // One room is not a table of contents.
    expect(html).not.toContain("photo-tour-section__rooms");
  });

  it("renders nothing when the listing has no tour photos", () => {
    expect(renderToStaticMarkup(<PhotoTour groups={[]} title="Casa Brisa" />)).toBe("");
    expect(
      renderToStaticMarkup(<PhotoTour groups={[{ label: "Pool", media: [] }]} title="Casa Brisa" />)
    ).toBe("");
  });
});
