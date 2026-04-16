"use client";

import { useTransition, useState } from "react";

type Props = {
  cardId: string;
  cardTitle: string;
  disabled?: boolean;
  action: (formData: FormData) => void | Promise<void>;
};

export function DeleteCardButton({ cardId, cardTitle, disabled = false, action }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [isPending, startTransition] = useTransition();

  const confirmed = typed === cardTitle;

  function handleDelete() {
    if (!confirmed) return;
    const fd = new FormData();
    fd.set("id", cardId);
    startTransition(async () => {
      await action(fd);
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { setTyped(""); setIsOpen(true); }}
        className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        Excluir experiência
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(22,13,7,0.65)] p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
        >
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-500">
              Ação irreversível
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
              Excluir experiência
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              Esta ação remove o card do banco e da vitrine permanentemente.
              Para confirmar, digite o nome exato da experiência abaixo:
            </p>

            <p className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-sand)] px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)]">
              {cardTitle}
            </p>

            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Digite o nome da experiência"
              autoFocus
              className="mt-3 w-full rounded-xl border border-[var(--color-line)] px-4 py-2.5 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-red-400"
            />

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={!confirmed || isPending}
                className="flex-1 rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPending ? "Excluindo..." : "Confirmar exclusão"}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-[var(--color-line)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-sand)]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
