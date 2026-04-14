import { FieldHelp } from "@/components/admin/field-help";

type FormFieldProps = {
  label: string;
  name: string;
  defaultValue?: string | number;
  placeholder?: string;
  required?: boolean;
  type?: string;
  helpText?: string;
};

export function FormField({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  type = "text",
  helpText,
}: FormFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="group flex items-center gap-2 text-sm font-medium text-[var(--color-ink)]">
        {label}
        {helpText ? <FieldHelp content={helpText} /> : null}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-12 rounded-2xl border border-[var(--color-line)] px-4 outline-none transition focus:border-[var(--color-brand)]"
      />
    </label>
  );
}
