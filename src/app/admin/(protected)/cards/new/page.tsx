import Link from "next/link";

import { createCardAction } from "@/app/admin/(protected)/actions";
import { CardForm } from "@/components/admin/card-form";

export default function NewCardPage() {
  return (
    <main className="px-6 py-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Novo card
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Criar experiencia
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
              Aqui voce cadastra a experiencia com texto, regras de quantidade e
              dados exibidos na vitrine.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-full border border-[var(--color-line)] px-5 py-3 text-sm font-semibold transition hover:bg-white"
          >
            Voltar
          </Link>
        </header>

        <section className="rounded-[2rem] border border-[var(--color-line)] bg-white p-8 shadow-sm">
          <CardForm action={createCardAction} submitLabel="Criar experiencia" />
        </section>
      </div>
    </main>
  );
}
