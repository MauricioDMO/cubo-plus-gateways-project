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
      className={cn(String.raw`[&_.PhoneInput]:flex [&_.PhoneInput]:items-center [&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:min-w-0
        [&_.PhoneInputInput]:self-stretch [&_.PhoneInputInput]:min-h-5.5 [&_.PhoneInputInput]:leading-[inherit]
        [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:text-heading [&_.PhoneInputInput]:[font-family:inherit]
        [&_.PhoneInputInput]:text-[14px] [&_.PhoneInputInput]:[font-weight:inherit] [&_.PhoneInputInput]:[font-style:inherit]
        [&_.PhoneInputInput]:[font-variant:inherit] [&_.PhoneInputInput]:tabular-nums [&_.PhoneInputInput]:[outline:none]
        [&_.PhoneInputInput]:border-0 [&_.PhoneInputCountryIcon]:w-5.5 [&_.PhoneInputCountryIcon]:h-4
        [&_.PhoneInputCountryIcon]:overflow-hidden [&_.PhoneInputCountryIcon]:shadow-[0_0_0_1px_rgba(15,_23,_39,_0.12)]
        [&_.PhoneInputCountryIcon]:rounded-[3px] [&_.PhoneInputCountryIcon--square]:w-[1em]
        [&_.PhoneInputCountryIcon--border]:bg-[rgba(0,0,0,0.1)]
        [&_.PhoneInputCountryIcon--border]:shadow-[0_0_0_1px_rgba(0,0,0,0.5),_inset_0_0_0_1px_rgba(0,0,0,0.5)]
        [&_.PhoneInputCountryIconImg]:block [&_.PhoneInputCountryIconImg]:w-full [&_.PhoneInputCountryIconImg]:h-full
        [&_.PhoneInputInternationalIconPhone]:opacity-80 [&_.PhoneInputInternationalIconGlobe]:opacity-65
        [&_.PhoneInputCountry]:relative [&_.PhoneInputCountry]:self-stretch [&_.PhoneInputCountry]:inline-flex
        [&_.PhoneInputCountry]:items-center [&_.PhoneInputCountry]:m-0 [&_.PhoneInputCountry]:gap-1.25
        [&_.PhoneInputCountrySelect]:absolute [&_.PhoneInputCountrySelect]:top-0 [&_.PhoneInputCountrySelect]:left-0
        [&_.PhoneInputCountrySelect]:h-full [&_.PhoneInputCountrySelect]:w-full [&_.PhoneInputCountrySelect]:z-[1]
        [&_.PhoneInputCountrySelect]:opacity-0 [&_.PhoneInputCountrySelect]:cursor-pointer
        [&_.PhoneInputCountrySelect]:border-0 [&_.PhoneInputCountrySelect[disabled]]:cursor-default
        [&_.PhoneInputCountrySelect[readonly]]:cursor-default [&_.PhoneInputCountrySelectArrow]:block
        [&_.PhoneInputCountrySelectArrow]:content-[''] [&_.PhoneInputCountrySelectArrow]:w-[0.3em]
        [&_.PhoneInputCountrySelectArrow]:h-[0.3em] [&_.PhoneInputCountrySelectArrow]:ml-[0.35em]
        [&_.PhoneInputCountrySelectArrow]:border-t-0 [&_.PhoneInputCountrySelectArrow]:border-b
        [&_.PhoneInputCountrySelectArrow]:border-l-0 [&_.PhoneInputCountrySelectArrow]:border-r
        [&_.PhoneInputCountrySelectArrow]:[transform:rotate(45deg)] [&_.PhoneInputCountrySelectArrow]:opacity-45
        [&_.PhoneInputCountrySelectArrow]:border-solid [&_.PhoneInputCountrySelectArrow]:border-[currentColor]
        [&_.PhoneInputCountrySelect:focus+.PhoneInputCountryIcon+.PhoneInputCountrySelectArrow]:opacity-100
        [&_.PhoneInputCountrySelect:focus+.PhoneInputCountryIcon+.PhoneInputCountrySelectArrow]:text-[#03b2cb]
        [&_.PhoneInputCountrySelect:focus+.PhoneInputCountryIcon--border]:shadow-[0_0_0_1px_#03b2cb,_inset_0_0_0_1px_#03b2cb]
        [&_.PhoneInputCountrySelect:focus+.PhoneInputCountryIcon_.PhoneInputInternationalIconGlobe]:opacity-100
        [&_.PhoneInputCountrySelect:focus+.PhoneInputCountryIcon_.PhoneInputInternationalIconGlobe]:text-[#03b2cb]
        [.booking-widget_&]:w-full [.booking-widget_&]:min-w-0 [.booking-widget_&]:min-h-11 [.booking-widget_&]:bg-background
        [.booking-widget_&]:text-heading [.booking-widget_&]:[font-family:inherit] [.booking-widget_&]:text-[14px]
        [.booking-widget_&]:[font-weight:inherit] [.booking-widget_&]:[font-style:inherit]
        [.booking-widget_&]:leading-[inherit] [.booking-widget_&]:[font-variant:inherit] [.booking-widget_&]:overflow-hidden
        [.booking-widget_&]:text-ellipsis [.booking-widget_&]:[transition:border-color_0.14s,_box-shadow_0.14s]
        [.booking-widget_&]:px-3 [.booking-widget_&]:py-2.5 [.booking-widget_&]:rounded-[8px] [.booking-widget_&]:border
        [.booking-widget_&]:border-solid [.booking-widget_&]:border-[rgba(15,_23,_39,_0.14)]
        [.booking-widget_&:hover]:border-[rgba(15,_23,_39,_0.3)]
        [.booking-widget_&:focus-within]:shadow-[0_0_0_3px_rgba(3,_155,_229,_0.18)]
        [.booking-widget_&:focus-within]:[outline:none] [.booking-widget_&:focus-within]:border-link flex items-center gap-2
        [.concierge-form\_\_details_&]:w-full [.concierge-form\_\_details_&]:min-w-0 [.concierge-form\_\_details_&]:min-h-13
        [.concierge-form\_\_details_&]:bg-[rgba(255,_255,_255,_0.68)] [.concierge-form\_\_details_&]:shadow-none
        [.concierge-form\_\_details_&]:text-[#26312f] [.concierge-form\_\_details_&]:[font-family:inherit]
        [.concierge-form\_\_details_&]:text-[15px] [.concierge-form\_\_details_&]:[font-weight:inherit]
        [.concierge-form\_\_details_&]:[font-style:inherit] [.concierge-form\_\_details_&]:leading-[inherit]
        [.concierge-form\_\_details_&]:[font-variant:inherit]
        [.concierge-form\_\_details_&]:[transition:border-color_0.16s_ease,_box-shadow_0.16s_ease,_background-color_0.16s_ease]
        [.concierge-form\_\_details_&]:flex [.concierge-form\_\_details_&]:items-center [.concierge-form\_\_details_&]:px-3.75
        [.concierge-form\_\_details_&]:py-3.25 [.concierge-form\_\_details_&]:gap-2.5
        [.concierge-form\_\_details_&]:rounded-[8px] [.concierge-form\_\_details_&]:border
        [.concierge-form\_\_details_&]:border-solid [.concierge-form\_\_details_&]:border-[rgba(57,_67,_66,_0.28)]
        [.concierge-form\_\_details_&_.PhoneInputInput::placeholder]:text-[rgba(38,_49,_47,_0.5)]
        [.concierge-form\_\_details_&_.PhoneInputInput::placeholder]:opacity-100
        [.concierge-form\_\_details_&:hover]:bg-[rgba(255,_255,_255,_0.9)]
        [.concierge-form\_\_details_&:hover]:border-[rgba(57,_67,_66,_0.52)]
        [.concierge-form\_\_details_&:focus-within]:bg-[rgba(255,_255,_255,_0.96)]
        [.concierge-form\_\_details_&:focus-within]:shadow-[0_0_0_3px_rgba(57,_67,_66,_0.13)]
        [.concierge-form\_\_details_&:focus-within]:[outline:none] [.concierge-form\_\_details_&:focus-within]:border-[#394342]
        [.concierge-form\_\_details_&_.PhoneInputInput]:self-stretch [.concierge-form\_\_details_&_.PhoneInputInput]:min-w-0
        [.concierge-form\_\_details_&_.PhoneInputInput]:min-h-6 [.concierge-form\_\_details_&_.PhoneInputInput]:bg-transparent
        [.concierge-form\_\_details_&_.PhoneInputInput]:text-inherit
        [.concierge-form\_\_details_&_.PhoneInputInput]:[font-family:inherit]
        [.concierge-form\_\_details_&_.PhoneInputInput]:[font-size:inherit]
        [.concierge-form\_\_details_&_.PhoneInputInput]:[font-weight:inherit]
        [.concierge-form\_\_details_&_.PhoneInputInput]:[font-style:inherit]
        [.concierge-form\_\_details_&_.PhoneInputInput]:leading-[inherit]
        [.concierge-form\_\_details_&_.PhoneInputInput]:[font-variant:inherit]
        [.concierge-form\_\_details_&_.PhoneInputInput]:[outline:none] [.concierge-form\_\_details_&_.PhoneInputInput]:border-0
        [.concierge-form\_\_details_&]:motion-reduce:transition-none`, className)}
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
