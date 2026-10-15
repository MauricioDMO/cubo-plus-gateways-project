import type { ReactNode } from "react";

export function SectionHeading({ eyebrow, title, description, children }: { eyebrow: string; title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="mb-[35px] flex items-end justify-between gap-6 max-[600px]:mb-[25px] max-[600px]:flex-col max-[600px]:items-start max-[600px]:gap-5">
      <div>
        <p className="mb-3 text-[10px] leading-[1.6] font-semibold tracking-[2px] text-ink-muted max-[600px]:mb-2.5 max-[600px]:text-[8px] max-[600px]:tracking-[1.7px]">{eyebrow}</p>
        <h2 className="font-display text-[clamp(28px,3vw,40px)] leading-[1.25] font-medium tracking-[-1.5px] text-ink-strong max-[600px]:text-[29px] max-[600px]:tracking-[-1.2px]">{title}</h2>
        {description && <p className="mt-3.5 text-sm leading-[1.65] text-ink-body max-[600px]:mt-[11px] max-[600px]:text-xs">{description}</p>}
      </div>
      {children}
    </div>
  );
}
