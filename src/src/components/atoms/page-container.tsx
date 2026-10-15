import type { ComponentProps } from "react";

export function PageContainer({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`mx-auto w-full max-w-[1204px] px-8 max-[600px]:px-5 ${className}`} {...props} />;
}
