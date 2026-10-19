"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

export default function Error({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  // Next.js 16.2+ also passes `retry`, which refreshes the router (re-running
  // server data fetching) before clearing the boundary's error state -- the
  // correct recovery action here, since our errors originate in a Server
  // Component's Supabase call. Plain `reset()` alone would just re-render the
  // same already-failed subtree without re-fetching. Typed optional so this
  // still degrades to `reset()` if an older Next.js only passes that.
  retry?: () => void;
}) {
  useEffect(() => {
    // Vercel captures server-side console output in function logs, so this
    // is what makes a real Supabase/RLS/network failure loud instead of
    // silently rendering as a 404.
    console.error(error);
  }, [error]);

  return (
    <div className="py-10 text-center">
      <h2>Something went wrong</h2>
      <p>We hit a problem loading this page. Please try again.</p>
      <button
        type="button"
        className="inline-flex cursor-pointer items-center justify-center rounded-full border-0 bg-button-bg px-7 py-2.25 font-body text-[16px] font-medium whitespace-nowrap text-button-text"
        onClick={() => (retry ?? reset)()}
      >
        Try again
      </button>
    </div>
  );
}
