"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

type Props = {
  from: string;
  to: string;
};

export function MetricsDateFilter({ from, to }: Props) {
  const router = useRouter();

  const update = useCallback(
    (key: "from" | "to", value: string) => {
      const params = new URLSearchParams({ from, to, [key]: value });
      router.push(`/admin/metrics?${params.toString()}`);
    },
    [from, to, router],
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
        De
        <input
          type="date"
          value={from}
          max={to}
          onChange={(e) => update("from", e.target.value)}
          className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
        Até
        <input
          type="date"
          value={to}
          min={from}
          onChange={(e) => update("to", e.target.value)}
          className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
        />
      </label>
    </div>
  );
}
