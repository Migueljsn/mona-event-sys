import { FieldHelp } from "@/components/admin/field-help";

type TextAreaFieldProps = {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  rows?: number;
  helpText?: string;
};

export function TextAreaField({
  label,
  name,
  defaultValue,
  placeholder,
  rows = 4,
  helpText,
}: TextAreaFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="group flex items-center gap-2 text-sm font-medium text-[var(--color-ink)]">
        {label}
        {helpText ? <FieldHelp content={helpText} /> : null}
      </span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="rounded-2xl border border-[var(--color-line)] px-4 py-3 outline-none transition focus:border-[var(--color-brand)]"
      />
    </label>
  );
}
