import { Icon, type IconName } from "../atoms/icon";

export function ContactMethod({ label, value, href, icon }: { label: string; value: string; href: string; icon: IconName }) {
  return (
    <a className="group flex min-w-0 items-center gap-4 border-b border-divider py-5 hover:text-coastal" href={href}>
      <span className="grid size-12 shrink-0 place-items-center rounded-card bg-coastal/5"><Icon name={icon} /></span>
      <span className="min-w-0"><span className="block text-[10px] font-semibold tracking-[1.5px] text-ink-muted uppercase">{label}</span><span className="mt-1 block text-base font-medium text-ink-strong [overflow-wrap:anywhere] max-[600px]:text-sm">{value}</span></span>
      <Icon name="diagonal" className="ml-auto size-4 shrink-0 text-icon-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none" />
    </a>
  );
}
