import type { ComponentProps } from "react";

export function ImageBadge({ className = "", ...props }: ComponentProps<"span">) {
  return <span className={`absolute inline-block rounded-full bg-image-badge font-medium text-inverse backdrop-blur-[8px] ${className}`} {...props} />;
}
