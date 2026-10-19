"use client";

import PhoneInput from "react-phone-number-input";
import { cn } from "@/shared/ui/utils";

type PhoneNumberFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export default function PhoneNumberField({ id, value, onChange, className }: PhoneNumberFieldProps) {
  return (
    <PhoneInput
      id={id}
      className={cn(`flex w-full min-w-0 min-h-11 items-center gap-2 overflow-hidden text-ellipsis rounded-lg border border-input
        bg-background px-3 py-2.5 text-sm leading-[inherit] text-heading transition-[border-color,box-shadow] duration-140 ease-[ease]
        hover:border-text/30 focus-within:border-link focus-within:outline-none focus-within:shadow-[0_0_0_3px_rgba(3,155,229,0.18)]
        [&_.PhoneInputCountryIcon]:w-5.5 [&_.PhoneInputCountryIcon]:h-4
        [&_.PhoneInputCountryIcon]:overflow-hidden [&_.PhoneInputCountryIcon]:shadow-[0_0_0_1px_rgba(15,_23,_39,_0.12)]
        [&_.PhoneInputCountryIcon]:rounded-[3px] [&_.PhoneInputCountryIcon--square]:w-[1em]
        [&_.PhoneInputCountryIcon--border]:bg-black/10
        [&_.PhoneInputCountryIcon--border]:shadow-[0_0_0_1px_rgba(0,0,0,0.5),_inset_0_0_0_1px_rgba(0,0,0,0.5)]
        [&_.PhoneInputCountryIconImg]:block [&_.PhoneInputCountryIconImg]:size-full
        [&_.PhoneInputInternationalIconPhone]:opacity-80 [&_.PhoneInputInternationalIconGlobe]:opacity-65
        [&_.PhoneInputCountry]:relative [&_.PhoneInputCountry]:self-stretch [&_.PhoneInputCountry]:inline-flex
        [&_.PhoneInputCountry]:items-center [&_.PhoneInputCountry]:m-0 [&_.PhoneInputCountry]:gap-1.25
        [&_.PhoneInputCountrySelectArrow]:block [&_.PhoneInputCountrySelectArrow]:size-[0.3em] [&_.PhoneInputCountrySelectArrow]:ml-[0.35em]
        [&_.PhoneInputCountrySelectArrow]:border-t-0 [&_.PhoneInputCountrySelectArrow]:border-b
        [&_.PhoneInputCountrySelectArrow]:border-l-0 [&_.PhoneInputCountrySelectArrow]:border-r
        [&_.PhoneInputCountrySelectArrow]:rotate-45 [&_.PhoneInputCountrySelectArrow]:opacity-45
        [&_.PhoneInputCountrySelectArrow]:border-current
        [&_.PhoneInputCountrySelect:focus+.PhoneInputCountryIcon+.PhoneInputCountrySelectArrow]:opacity-100
        [&_.PhoneInputCountrySelect:focus+.PhoneInputCountryIcon+.PhoneInputCountrySelectArrow]:text-[#03b2cb]
        [&_.PhoneInputCountrySelect:focus+.PhoneInputCountryIcon--border]:shadow-[0_0_0_1px_#03b2cb,_inset_0_0_0_1px_#03b2cb]
        [&_.PhoneInputCountrySelect:focus+.PhoneInputCountryIcon_.PhoneInputInternationalIconGlobe]:opacity-100
        [&_.PhoneInputCountrySelect:focus+.PhoneInputCountryIcon_.PhoneInputInternationalIconGlobe]:text-[#03b2cb]`, className)}
      numberInputProps={{
        className: `flex-1 min-w-0 min-h-5.5 self-stretch border-0 bg-transparent text-inherit tabular-nums outline-none
          [font-family:inherit] [font-size:inherit] [font-weight:inherit] [font-style:inherit] [font-variant:inherit] leading-[normal]`,
      }}
      countrySelectProps={{
        className: "absolute inset-0 z-1 size-full cursor-pointer border-0 opacity-0 disabled:cursor-default [&[readonly]]:cursor-default",
      }}
      defaultCountry="US"
      international
      countryCallingCodeEditable={false}
      value={value || undefined}
      onChange={(nextValue) => onChange(nextValue ?? "")}
      placeholder="(555) 000-0000"
      autoComplete="tel"
    />
  );
}
