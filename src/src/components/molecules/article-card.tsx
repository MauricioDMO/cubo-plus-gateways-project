import Image from "next/image";
import type { articles } from "@/content/landing";
import { Icon } from "../atoms/icon";

export function ArticleCard({ article }: { article: (typeof articles)[number] }) {
  return (
    <article className="group">
      <a className="relative block aspect-[1.5] overflow-hidden rounded-card" href={article.href} aria-label={`Read ${article.title}`}>
        <Image className="object-cover transition-transform motion-reduce:transition-none duration-500 group-hover:scale-[1.04]" src={article.image} alt={article.alt} fill sizes="(max-width: 700px) 100vw, 33vw" />
        <span className="absolute right-[15px] bottom-[15px] inline-flex size-[33px] items-center justify-center rounded-full border border-inverse/55 bg-surface-white/95 text-ink-strong transition-colors motion-reduce:transition-none duration-200 hover:bg-surface-white"><Icon name="diagonal" className="size-4" /></span>
      </a>
      <div className="mt-[18px] mb-[9px] flex items-center justify-between gap-2.5 text-[9px] max-[850px]:flex-wrap max-[850px]:gap-[5px] max-[850px]:text-[8px] max-[600px]:flex-nowrap max-[600px]:text-[9px]"><span className="font-semibold tracking-[1px] text-coastal uppercase">{article.category}</span><time className="whitespace-nowrap text-ink-muted" dateTime={article.dateTime}>{article.date}</time></div>
      <h3 className="font-display text-lg leading-[1.55] font-medium tracking-[-.5px] text-ink-strong max-[850px]:text-[15px] max-[600px]:text-[21px] max-[600px]:leading-[1.5]"><a className="hover:underline hover:underline-offset-4" href={article.href}>{article.title}</a></h3>
    </article>
  );
}
