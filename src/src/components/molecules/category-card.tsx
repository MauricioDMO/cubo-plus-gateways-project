import Image from "next/image";
import type { categories } from "@/content/landing";
import { Icon } from "../atoms/icon";
import { ImageBadge } from "../atoms/image-badge";

export function CategoryCard({ category }: { category: (typeof categories)[number] }) {
  return (
    <a className="group relative isolate block h-[440px] overflow-hidden rounded-feature text-inverse after:absolute after:inset-0 after:-z-10 after:bg-[linear-gradient(0deg,rgba(8,29,21,.84),rgba(8,29,21,.03)_68%)] max-[1150px]:h-[390px] max-[850px]:h-[370px]" href={category.href}>
      <Image className="object-cover -z-20 transition-transform motion-reduce:transition-none duration-600 ease-in-out group-hover:scale-[1.035]" src={category.image} alt={category.alt} fill sizes="(max-width: 700px) 100vw, 60vw" />
      <ImageBadge className="top-[22px] left-[22px] border border-inverse/35 px-[13px] py-[5px] text-[10px]">{category.count}</ImageBadge>
      <div className="absolute right-[30px] bottom-[30px] left-[30px] flex items-end justify-between gap-6 max-[850px]:right-[23px] max-[850px]:bottom-[23px] max-[850px]:left-[23px] max-[850px]:gap-3 max-[600px]:right-[25px] max-[600px]:bottom-[26px] max-[600px]:left-[25px] max-[600px]:gap-[15px]">
        <div><h3 className="mb-2.5 font-display text-[31px] font-medium tracking-[-1px] max-[850px]:text-[25px] max-[600px]:text-[29px]">{category.title}</h3><p className="max-w-[330px] text-xs leading-[1.8] text-inverse/95 max-[850px]:text-[11px] max-[600px]:text-xs">{category.description}</p></div>
        <span className="inline-flex size-[43px] shrink-0 items-center justify-center rounded-full border border-inverse/55 transition-colors motion-reduce:transition-none duration-200 group-hover:bg-surface-white group-hover:text-ink-strong max-[850px]:size-8 max-[600px]:size-[38px]"><Icon name="diagonal" /></span>
      </div>
    </a>
  );
}
