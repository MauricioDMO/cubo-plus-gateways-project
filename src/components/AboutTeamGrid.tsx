"use client";

import { useState } from "react";

/*
 * Client-only for the click-to-reveal quote overlay. A card with a quote
 * opens it on click; name and role stay visible on the card.
 */

export type AboutTeamMember = {
  key: string;
  name: string;
  role: string;
  quote?: string;
  photoUrl?: string;
  /** Where the photo sits in its card ("50% 20%"), when set. */
  photoFocus?: string;
};

export default function AboutTeamGrid({ members }: { members: AboutTeamMember[] }) {
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const toggle = (key: string) => setRevealedKey((current) => (current === key ? null : key));

  return (
    <div className="about-team__grid">
      {members.map((member) => {
        const hasQuote = Boolean(member.quote);
        const open = revealedKey === member.key;
        return (
          <figure
            className={`about-team__card${hasQuote ? " about-team__card--has-quote" : ""}`}
            key={member.key}
            onClick={hasQuote ? () => toggle(member.key) : undefined}
          >
            {member.photoUrl ? (
              <img
                className="about-team__photo"
                src={member.photoUrl}
                alt={member.name}
                loading="lazy"
                style={member.photoFocus ? { objectPosition: member.photoFocus } : undefined}
              />
            ) : null}
            <figcaption className="about-team__caption">
              <p className="about-team__name">{member.name}</p>
              <p className="about-team__role">{member.role}</p>
            </figcaption>
            {hasQuote && (
              <div className={`about-team__reveal${open ? " is-open" : ""}`}>
                <p className="about-team__quote">&ldquo;{member.quote}&rdquo;</p>
              </div>
            )}
            {hasQuote && (
              <button type="button" className="gx-quote-toggle" onClick={() => toggle(member.key)}>
                {open ? "Hide quote" : "Quote"}
              </button>
            )}
          </figure>
        );
      })}
    </div>
  );
}
