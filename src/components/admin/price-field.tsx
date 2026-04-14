"use client";

import { useMemo, useState } from "react";

import { FieldHelp } from "@/components/admin/field-help";

type PriceFieldProps = {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  helpText?: string;
};

function formatBrlCurrency(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const amount = Number(digits) / 100;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

export function PriceField({
  label,
  name,
  defaultValue,
  placeholder,
  helpText,
}: PriceFieldProps) {
  const initialValue = useMemo(
    () => formatBrlCurrency(defaultValue ?? ""),
    [defaultValue],
  );

  const [value, setValue] = useState(initialValue);

  return (
    <label className="flex flex-col gap-2">
      <span className="group flex items-center gap-2 text-sm font-medium text-[var(--color-ink)]">
        {label}
        {helpText ? <FieldHelp content={helpText} /> : null}
      </span>
      <input
        name={name}
        type="text"
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          setValue(formatBrlCurrency(event.target.value));
        }}
        className="h-12 rounded-2xl border border-[var(--color-line)] px-4 outline-none transition focus:border-[var(--color-brand)]"
      />
    </label>
  );
}
