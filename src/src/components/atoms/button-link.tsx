import type { ComponentProps } from "react";
import Link from "next/link";
import { Icon } from "./icon";

const variants = {
  primary: "border-transparent bg-coastal text-inverse shadow-action hover:bg-coastal/90",
  light: "border-transparent bg-surface-white text-inverse-action shadow-inverse-action hover:bg-surface-white/90 max-[600px]:gap-4 max-[600px]:px-[18px] max-[600px]:text-[11px]",
  outline: "border-divider text-ink-strong hover:bg-coastal/5",
};

export function ButtonLink({ children, className = "", variant = "primary", ...props }: ComponentProps<typeof Link> & { variant?: "primary" | "light" | "outline" }) {
  return (
    <Link className={`inline-flex min-h-[49px] items-center justify-center gap-[26px] rounded-full border px-[23px] py-[13px] text-xs leading-normal font-medium whitespace-nowrap transition-[background,transform] motion-reduce:transition-none duration-200 hover:-translate-y-0.5 ${variants[variant]} ${className}`} {...props}>
      {children}<Icon name="arrow" className="size-[17px]" />
    </Link>
  );
}
