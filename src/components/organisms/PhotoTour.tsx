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
    <section className="photo-tour-section" id="photos" aria-label="Photo tour">
      {/* The section says what it is.

          It had only an aria-label, on the reasoning that the room headings
          below label the content -- true on a desktop, where the tour sits in
          its own column. On a phone everything is one column, so the row of
          room links arrived directly under the last description accordion with
          nothing above it and read as leftover filter chips. Still no photo
          count: that number was taken off the mobile opener for the same
          reason it does not belong here. */}
      <h2 className="photo-tour-section__title">Photo tour</h2>
      {groups.length > 1 && (
        <nav className="photo-tour-section__rooms" aria-label="Jump to a room">
          {groups.map((group) => (
            <a key={group.label} className="photo-tour__tab" href={`#${sectionId(group.label)}`}>
              {group.label}
            </a>
          ))}
        </nav>
      )}

      <div className="photo-tour__rooms">
        {groups.map((group) => {
          const id = sectionId(group.label);
          return (
            <section key={group.label} id={id} className="photo-tour__room" aria-labelledby={`${id}-title`}>
              <h3 id={`${id}-title`} className="photo-tour__room-title">
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
