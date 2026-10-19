"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { youtubeVideoId } from "@/shared/media/video-embed";

/*
 * The property's video, when the admin has put a YouTube link on it.
 *
 * Facade first, iframe second. Embedding YouTube outright costs the page
 * around a megabyte of player and a set of cookies before anybody has decided
 * to watch anything -- on a listing page whose job is to load fast on a phone
 * on Salvadoran mobile data. So the section renders the poster frame and a
 * play button, and only mounts the player when it is clicked.
 *
 * The URL is parsed with youtubeVideoId(), the same function the admin editor
 * and the HTML sanitiser use, so a link that works in one place works in all
 * three. Anything it cannot read renders nothing at all: a listing with a
 * mistyped URL shows no video section rather than a broken black rectangle.
 */
export default function ListingVideo({ url, title }: { url: string | null | undefined; title: string }) {
  const [playing, setPlaying] = useState(false);
  const id = youtubeVideoId(url);
  if (!id) return null;

  return (
    <section className="max-[960.001px]:col-auto max-[960.001px]:row-auto mt-10 mb-0 scroll-mt-20 mx-0 [&>h2]:mt-0 [&>h2]:mb-3.5 [&>h2]:text-[28px]
      [&>h2]:leading-[1.2] [&>h2]:mx-0 min-[961px]:col-span-full min-[961px]:row-2" id="video">
      <h2>Video tour</h2>
      <div className="relative aspect-[16_/_9] overflow-hidden bg-[#0f1727] rounded-[12px] [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0">
        {playing ? (
          <iframe
            /* nocookie, and autoplay because the click that mounted this WAS
               the play. Without it the guest has to press play twice. */
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={`Video of ${title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button type="button" className="listing-video__play block w-full h-full bg-transparent cursor-pointer p-0 border-0 [&_img]:block [&_img]:w-full [&_img]:h-full
            [&_img]:object-cover" onClick={() => setPlaying(true)}>
            <Image
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              fill
              sizes="(max-width: 960px) 100vw, 900px"
              alt=""
              loading="lazy"
              /* Decorative: the button's own label says what pressing it does,
                 and a second description of the same poster would be read out
                 twice. */
              aria-hidden="true"
            />
            <span className="absolute top-[50%] left-[50%] flex items-center justify-center w-16 h-16 [transform:translate(-50%,_-50%)]
              bg-[rgba(255,_255,_255,_0.94)] text-[#0f1727] shadow-[0_2px_14px_rgba(15,_23,_39,_0.35)] rounded-full
              [.listing-video\_\_play:hover_&]:bg-white [.listing-video\_\_play:focus-visible_&]:bg-white" aria-hidden="true">
              <Play size={22} fill="currentColor" />
            </span>
            <span className="absolute w-0.25 h-0.25 overflow-hidden [clip:rect(0,_0,_0,_0)] whitespace-nowrap m-[-1px] p-0 border-0">Play the video of {title}</span>
          </button>
        )}
      </div>
    </section>
  );
}
