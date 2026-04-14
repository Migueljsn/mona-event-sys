"use client";

import { useState } from "react";

type FieldHelpProps = {
  content: string;
};

export function FieldHelp({ content }: FieldHelpProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="Ajuda do campo"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onBlur={() => setOpen(false)}
        className="inline-flex size-5 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-xs font-semibold text-[var(--color-muted)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
      >
        ?
      </button>

      <span
        className={`pointer-events-none absolute left-0 top-7 z-20 w-72 rounded-2xl border border-[var(--color-line)] bg-[var(--color-ink)] px-3 py-2 text-xs leading-5 text-white shadow-lg transition md:group-hover:opacity-100 md:group-hover:translate-y-0 md:group-hover:pointer-events-auto ${
          open
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        {content}
      </span>
    </span>
  );
}
