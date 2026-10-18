"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { youtubeVideoId } from "@/lib/video-embed";

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
    <section className="listing-video" id="video">
      <h2>Video tour</h2>
      <div className="listing-video__frame">
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
          <button type="button" className="listing-video__play" onClick={() => setPlaying(true)}>
            <img
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              /* Decorative: the button's own label says what pressing it does,
                 and a second description of the same poster would be read out
                 twice. */
              aria-hidden="true"
            />
            <span className="listing-video__play-icon" aria-hidden="true">
              <Play size={22} fill="currentColor" />
            </span>
            <span className="sr-only">Play the video of {title}</span>
          </button>
        )}
      </div>
    </section>
  );
}
