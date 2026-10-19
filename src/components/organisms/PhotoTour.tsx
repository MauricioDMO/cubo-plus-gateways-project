import PhotoTourRoom from "@/components/organisms/PhotoTourRoom";
import { slugify } from "@/shared/utils/strings";

type TourMedia = { id: number; storage_path: string; alt_text: string | null; width?: number; height?: number };
export type TourGroup = { label: string; media: TourMedia[] };

/**
 * Every property photograph, grouped by room in one continuous page flow.
 *
 * This stays a server component. The sticky room links are a table of
 * contents, not a filter, so every image stays visible with or without
 * JavaScript, and the room headings have no reason to hydrate.
 * Only the photographs themselves are interactive -- see PhotoTourRoom, which
 * makes each one a button and owns the viewer it opens.
 */
export default function PhotoTour({ groups, title }: { groups: TourGroup[]; title: string }) {
  const total = groups.reduce((sum, group) => sum + group.media.length, 0);
  const sectionId = (label: string) => `tour-${slugify(label) || "photos"}`;

  if (total === 0) return null;

  return (
    <section className="max-[960.001px]:col-auto max-[960.001px]:row-auto mt-10 mb-0 scroll-mt-20 min-w-0 mx-0 min-[961px]:col-span-full
      min-[961px]:row-[3]" id="photos" aria-label="Photo tour">
      {/* The section says what it is.

          It had only an aria-label, on the reasoning that the room headings
          below label the content -- true on a desktop, where the tour sits in
          its own column. On a phone everything is one column, so the row of
          room links arrived directly under the last description accordion with
          nothing above it and read as leftover filter chips. Still no photo
          count: that number was taken off the mobile opener for the same
          reason it does not belong here. */}
      <h2 className="mt-0 mb-7 text-heading text-[clamp(30px,_3vw,_38px)] leading-[1.1] mx-0 [&::before]:content-[''] [&::before]:block
        [&::before]:w-11.5 [&::before]:h-1 [&::before]:bg-button-bg [&::before]:mb-3.5 [&::before]:rounded-full">Photo tour</h2>
      {groups.length > 1 && (
        <nav className="first:mt-0 sticky top-0 z-[10] flex mt-4.5 mb-0 overflow-x-auto bg-[color-mix(in_srgb,_var(--color-background)_94%,_transparent)]
          [scrollbar-width:thin] mx-0 px-0 py-2.5 gap-2" aria-label="Jump to a room">
          {groups.map((group) => (
            <a key={group.label} className="inline-flex items-center flex-none bg-background [font-family:inherit] text-[14px] [font-weight:inherit] [font-style:inherit]
              leading-[inherit] [font-variant:inherit] text-body-text no-underline px-3.5 py-1.75 rounded-full border border-solid border-border
              hover:text-heading hover:border-[rgba(15,_23,_39,_0.85)] focus-visible:text-heading focus-visible:border-[rgba(15,_23,_39,_0.85)]" href={`#${sectionId(group.label)}`}>
              {group.label}
            </a>
          ))}
        </nav>
      )}

      <div className="grid mt-7 gap-[clamp(42px,_7vw,_72px)]">
        {groups.map((group) => {
          const id = sectionId(group.label);
          return (
            <section key={group.label} id={id} className="w-full scroll-mt-22" aria-labelledby={`${id}-title`}>
              <h3 id={`${id}-title`} className="mt-0 mb-4.5 text-[24px] leading-[1.2] text-heading mx-0">
                {group.label}
              </h3>
              <PhotoTourRoom label={group.label} media={group.media} title={title} />
            </section>
          );
        })}
      </div>
    </section>
  );
}
