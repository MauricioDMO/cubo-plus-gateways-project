import Image from "next/image";
import type { Property } from "@/content/landing";
import { Icon } from "../atoms/icon";
import { ImageBadge } from "../atoms/image-badge";

export function PropertyCard({ property }: { property: Property }) {
  return (
    <article className="group min-w-0 overflow-hidden rounded-card border border-divider bg-surface-white transition-[box-shadow,transform] duration-250 hover:-translate-y-1 hover:shadow-card">
      <a className="relative block aspect-[1.36] overflow-hidden max-[600px]:aspect-[1.35]" href={property.href} aria-label={`Explore ${property.name}`}>
        <Image className="transition-transform duration-500 group-hover:scale-[1.035]" src={property.image} alt={property.alt} fill sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw" />
        <ImageBadge className="top-4 left-4 px-[11px] py-1 text-[9px]">{property.category}</ImageBadge>
        <span className="absolute top-[15px] right-[15px] grid size-[30px] place-items-center rounded-full bg-surface-white/85 text-ink-strong"><Icon name="diagonal" className="size-[15px]" /></span>
      </a>
      <div className="px-[21px] pt-[21px] max-[1150px]:px-4 max-[1150px]:pt-[18px] max-[600px]:px-[23px] max-[600px]:pt-[23px]">
        <p className="mb-2 flex items-center gap-[5px] text-[10px] text-ink-muted"><Icon name="pin" className="size-3" />{property.location}</p>
        <h3 className="font-display text-lg leading-[1.4] font-medium tracking-[-.6px] text-ink-strong max-[1150px]:text-base max-[600px]:text-[21px]"><a href={property.href}>{property.name}</a></h3>
        <p className="mt-1.5 text-[11px] leading-[1.65] text-ink-body max-[600px]:text-xs">{property.subtitle}</p>
        <div className="mt-[19px] flex items-center gap-5 pb-[19px] text-[10px] text-ink-body max-[1150px]:gap-2.5 max-[1150px]:text-[9px] max-[600px]:gap-[25px] max-[600px]:text-[11px]">
          <span className="flex items-center gap-1.5"><Icon name="bed" className="size-4 text-icon-muted" />{property.bedrooms} bedrooms</span>
          <span className="flex items-center gap-1.5"><Icon name="bath" className="size-4 text-icon-muted" />{property.bathrooms} bathrooms</span>
        </div>
        <div className="flex items-center justify-between gap-1.5 border-t border-divider py-[9px]">
          <p className="text-[9px] text-ink-muted max-[600px]:text-[10px]">{property.amenities.join(" · ")}</p>
          <a className="inline-flex h-[35px] w-11 items-center justify-end text-ink-strong" href={property.href} aria-label={`View ${property.name}`}><Icon name="arrow" className="size-[17px]" /></a>
        </div>
      </div>
    </article>
  );
}
