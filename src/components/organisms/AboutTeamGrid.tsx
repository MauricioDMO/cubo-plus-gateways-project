"use client";

import { useState } from "react";
import Image from "next/image";

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
    <div className="flex flex-wrap text-left gap-[clamp(18px,_3vw,_28px)] max-[640.001px]:gap-4">
      {members.map((member) => {
        const hasQuote = Boolean(member.quote);
        const open = revealedKey === member.key;
        return (
          <figure
            className={`relative grow shrink basis-[18%] min-w-31 aspect-[3/4] overflow-hidden bg-[#394342]
              shadow-[0_3px_14px_rgba(57,_67,_66,_0.15)] [transition:transform_0.5s_cubic-bezier(0.2,_0.8,_0.2,_1),_box-shadow_0.5s]
              rounded-[6px] [&:nth-child(10n+1)]:[transform:rotate(-3deg)_translateY(8px)]
              [&:nth-child(10n+2)]:[transform:rotate(2deg)_translateY(-10px)]
              [&:nth-child(10n+3)]:[transform:rotate(3deg)_translateY(-6px)]
              [&:nth-child(10n+4)]:[transform:rotate(-4deg)_translateY(10px)]
              [&:nth-child(10n+5)]:[transform:rotate(2deg)_translateY(-12px)]
              [&:nth-child(10n+6)]:[transform:rotate(3deg)_translateY(-8px)]
              [&:nth-child(10n+7)]:[transform:rotate(-3deg)_translateY(10px)]
              [&:nth-child(10n+8)]:[transform:rotate(4deg)_translateY(-6px)]
              [&:nth-child(10n+9)]:[transform:rotate(-2deg)_translateY(8px)]
              [&:nth-child(10n)]:[transform:rotate(3deg)_translateY(-10px)]
              hover:[transform:rotate(0deg)_translateY(-6px)_scale(1.06)] hover:shadow-[0_20px_40px_rgba(57,_67,_66,_0.28)]
              hover:z-5 max-[640.001px]:basis-[calc(50%_-_8px)] max-[640.001px]:min-w-0 ${hasQuote ? "cursor-pointer" : ""}`}
            key={member.key}
            onClick={hasQuote ? () => toggle(member.key) : undefined}
          >
            {member.photoUrl ? (
              <Image
                className="block size-full object-cover"
                src={member.photoUrl}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 960px) 33vw, 20vw"
                alt={member.name}
                loading="lazy"
                style={member.photoFocus ? { objectPosition: member.photoFocus } : undefined}
              />
            ) : null}
            <figcaption className={`absolute inset-x-0 bottom-0 pt-7 pb-3.5 [background:linear-gradient(180deg,_transparent,_rgba(20,_24,_24,_0.88))]
              pointer-events-none text-center [transition:opacity_0.2s_ease] px-3.5 ${hasQuote && open ? "opacity-0" : ""}`}>
              <p className="text-white [font-family:'Courier_New',_monospace] text-[clamp(18px,_1.6vw,_24px)] font-bold tracking-[0.02em] leading-[1.2] m-0">{member.name}</p>
              <p className="mt-0.25 mb-0 text-[rgba(255,_255,_255,_0.85)] [font-family:'Courier_New',_monospace] text-[clamp(13px,_1.1vw,_16px)]
                tracking-[0.02em] leading-[1.3] mx-0">{member.role}</p>
            </figcaption>
            {hasQuote && (
              <div className={`absolute inset-0 flex items-center justify-center bg-[rgba(35,_42,_41,_0.93)]
                overflow-y-auto [transition:opacity_0.2s_ease] p-5 max-[640.001px]:px-2.5
                max-[640.001px]:py-3.5 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
                <p className="text-white [font-family:'Courier_New',_monospace] text-[clamp(14px,_1.3vw,_17px)] leading-[1.5] text-center m-0
                  max-[640.001px]:text-[10px] max-[640.001px]:leading-[1.3]">&ldquo;{member.quote}&rdquo;</p>
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
