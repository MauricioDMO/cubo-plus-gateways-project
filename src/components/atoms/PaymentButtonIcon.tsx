export default function PaymentButtonIcon() {
  return (
    <span className="relative inline-grid w-5.5 h-4.5 flex-none basis-5.5 place-items-center" aria-hidden="true">
      <span className="absolute left-0.25 top-1 w-4.25 h-2.75 bg-[color-mix(in_oklch,_var(--color-accent)_44%,_rgb(250,_251,_249))] shadow-[4px_4px_9px_rgba(0,_0,_0,_0.18)] origin-[80%_50%] rounded-[3px] group-[:hover:not(:disabled)]/payment:animate-[payment-card-slide_760ms_cubic-bezier(0.16,_1,_0.3,_1)_both] group-[:hover:not(:disabled)]/payment:motion-reduce:animate-none">
        <span className="absolute top-0.75 left-0.5 w-3.25 h-0.5 bg-[rgba(57,_67,_66,_0.56)] rounded-full" />
        <span className="absolute right-0.75 bottom-0.5 size-0.75 bg-[rgba(57,_67,_66,_0.65)] shadow-[-5px_0_0_rgba(57,_67,_66,_0.34)] rounded-full" />
      </span>
      <span className="absolute right-0 bottom-0.25 grid w-2.25 h-3.25 bg-[rgb(245,_247,_244)] shadow-[0_2px_6px_rgba(0,_0,_0,_0.22)] [transform:translateY(12px)] opacity-0 px-0.5 py-0.75 gap-0.5 rounded-[2px] [&_span]:h-0.25 [&_span]:bg-[rgba(57,_67,_66,_0.55)] [&_span]:rounded-full group-[:hover:not(:disabled)]/payment:animate-[payment-receipt-rise_620ms_cubic-bezier(0.16,_1,_0.3,_1)_130ms_both] group-[:hover:not(:disabled)]/payment:motion-reduce:animate-none">
        <span />
        <span />
        <span />
      </span>
    </span>
  );
}
