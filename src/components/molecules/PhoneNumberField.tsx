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
      className={cn("booking-phone-input", className)}
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
