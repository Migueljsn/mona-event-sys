import Link from "next/link";
import { notFound } from "next/navigation";

import {
  deleteCardAction,
  updateCardAction,
} from "@/app/admin/(protected)/actions";
import { CardForm } from "@/components/admin/card-form";
import { getAdminCardById } from "@/lib/data/cards";
import { hasSupabaseEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

type CardEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CardEditPage({ params }: CardEditPageProps) {
  const { id } = await params;
  const card = await getAdminCardById(id);

  if (!card) {
    notFound();
  }

  return (
    <main className="px-6 py-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Editar card
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              {card.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
              Ajuste conteúdo, limites de quantidade e exibição pública desta
              experiência.
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
          <CardForm
            action={updateCardAction}
            card={card}
            submitLabel="Salvar alteracoes"
            disabled={!hasSupabaseEnv()}
          />
        </section>

        <section className="rounded-[2rem] border border-red-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-red-700">
            Excluir experiencia
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Esta ação remove o card do banco e da vitrine. Use apenas quando não
            fizer mais sentido manter o item.
          </p>

          <form action={deleteCardAction} className="mt-5">
            <input type="hidden" name="id" value={card.id} />
            <button
              type="submit"
              disabled={!hasSupabaseEnv()}
              className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Excluir experiencia
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
