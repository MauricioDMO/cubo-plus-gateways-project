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
    <section className="max-[960.001px]:col-auto max-[960.001px]:row-auto mt-10 mb-0 scroll-mt-20 mx-0 min-[961px]:col-span-full min-[961px]:row-2" id="video">
      <h2 className="mt-0 mb-3.5 text-[28px] leading-[1.2] mx-0">Video tour</h2>
      <div className="relative aspect-video overflow-hidden bg-text rounded-xl">
        {playing ? (
          <iframe
            className="size-full border-0"
            /* nocookie, and autoplay because the click that mounted this WAS
               the play. Without it the guest has to press play twice. */
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={`Video of ${title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button type="button" className="group block size-full bg-transparent cursor-pointer p-0 border-0" onClick={() => setPlaying(true)}>
            <Image
              className="block size-full object-cover"
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
            <span className="absolute top-1/2 left-1/2 flex items-center justify-center size-16 -translate-1/2
              bg-white/94 text-text shadow-[0_2px_14px_rgba(15,_23,_39,_0.35)] rounded-full
              group-hover:bg-white group-focus-visible:bg-white" aria-hidden="true">
              <Play size={22} fill="currentColor" />
            </span>
            <span className="sr-only">Play the video of {title}</span>
          </button>
        )}
      </div>
    </section>
  );
}
