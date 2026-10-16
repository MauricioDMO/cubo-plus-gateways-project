import type { SVGProps } from "react";

const paths = {
  arrow: "M4 12h16m-6-6 6 6-6 6",
  diagonal: "M6 18 18 6M6 6h12v12",
  chevron: "m9 5 7 7-7 7",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM12 7v6m-3-3h6",
  wave: "M2 8c3-4 5 4 8 0s5 4 8 0 4 0 4 0M2 15c3-4 5 4 8 0s5 4 8 0 4 0 4 0",
  home: "m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8",
  chat: "M21 11a8 8 0 0 1-8 8H6l-4 3V11a9 9 0 0 1 19 0ZM7 11h.01M12 11h.01M17 11h.01",
  calendar: "M4 5h16v16H4ZM8 2v6m8-6v6M4 10h16m-12 5 3 3 5-5",
  bed: "M3 18v3m18-3v3M3 18h18v-7H3ZM5 11V5h14v6M7 8h3m4 0h3",
  bath: "M3 12h18m-17 0v4a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-4M6 20l-1 2m13-2 1 2M6 12V5a3 3 0 0 1 6 0m-3 1h6",
  check: "m5 12 4 4L19 6",
  globe: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z",
  key: "M14 14a6 6 0 1 0-4-4L2 18v4h4v-3h3v-3l1-2Zm3-7h.01",
  user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 22v-2a8 8 0 0 1 16 0v2",
  mail: "M3 5h18v14H3ZM3 5l9 8 9-8",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3.1 5.2 2 2 0 0 1 5.1 3h3a1 1 0 0 1 1 .9c.1.9.3 1.7.6 2.5a1 1 0 0 1-.2 1L8.2 8.8a16 16 0 0 0 6 6l1.4-1.3a1 1 0 0 1 1-.2c.8.3 1.6.5 2.5.6a1 1 0 0 1 .9 1Z",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "m6 6 12 12M6 18 18 6",
  instagram: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm9 9a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm1-5h.01",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d={paths[name]} />
    </svg>
  );
}
