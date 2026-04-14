import Link from "next/link";

import { toggleCardStatusAction } from "@/app/admin/(protected)/actions";
import { getAdminCards, getSettings } from "@/lib/data/cards";
import { getCardStatus } from "@/lib/format";

export default async function AdminPage() {
  const [cards, settings] = await Promise.all([getAdminCards(), getSettings()]);
  const activeCards = cards.filter((card) => getCardStatus(card) === "Ativo").length;
  const expiredCards = cards.filter(
    (card) => getCardStatus(card) === "Expirado",
  ).length;

  return (
    <main className="px-6 py-12 text-[var(--color-ink)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <span className="w-fit rounded-full border border-[var(--color-line)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
            Area interna autenticada
          </span>
          <h1 className="text-4xl font-semibold tracking-tight">
            Painel administrativo
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--color-muted)]">
            Esta area ja esta lendo dados reais do Supabase. O proximo passo e
            transformar este dashboard em CRUD completo de experiencias.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <article className="rounded-3xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-[var(--color-muted)]">
              Total de experiencias
            </p>
            <strong className="mt-3 block text-4xl font-semibold">
              {cards.length}
            </strong>
          </article>

          <article className="rounded-3xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-[var(--color-muted)]">
              Experiencias ativas
            </p>
            <strong className="mt-3 block text-4xl font-semibold">
              {activeCards}
            </strong>
          </article>

          <article className="rounded-3xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-[var(--color-muted)]">
              WhatsApp configurado
            </p>
            <strong className="mt-3 block text-lg font-semibold">
              {settings.business_whatsapp_number}
            </strong>
          </article>

          <article className="rounded-3xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-[var(--color-muted)]">
              Experiencias expiradas
            </p>
            <strong className="mt-3 block text-4xl font-semibold">
              {expiredCards}
            </strong>
          </article>
        </section>

        <section className="rounded-[2rem] border border-[var(--color-line)] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Experiencias cadastradas
              </h2>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                CRUD operacional disponivel no painel. O proximo bloco sera
                upload real de imagens e vitrine com carrinho.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/settings"
                className="rounded-full border border-[var(--color-line)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-sand)]"
              >
                Configurar WhatsApp
              </Link>
              <Link
                href="/admin/cards/new"
                className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Novo card
              </Link>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[var(--color-line)]">
            <table className="min-w-full divide-y divide-[var(--color-line)] text-sm">
              <thead className="bg-[var(--color-sand)] text-left text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Titulo</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Quantidade</th>
                  <th className="px-4 py-3 font-medium">Ordem</th>
                  <th className="px-4 py-3 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)] bg-white">
                {cards.length ? (
                  cards.map((card) => (
                    <tr key={card.id}>
                      <td className="px-4 py-4">
                        <div className="font-medium">{card.title}</div>
                        <div className="text-xs text-[var(--color-muted)]">
                          /{card.slug}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {getCardStatus(card)}
                      </td>
                      <td className="px-4 py-4">
                        {card.min_quantity} a {card.max_quantity} {card.unit_label}
                      </td>
                      <td className="px-4 py-4">{card.display_order}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/admin/cards/${card.id}`}
                            className="rounded-full border border-[var(--color-line)] px-3 py-2 text-xs font-semibold transition hover:bg-[var(--color-sand)]"
                          >
                            Editar
                          </Link>
                          <form action={toggleCardStatusAction}>
                            <input type="hidden" name="id" value={card.id} />
                            <input
                              type="hidden"
                              name="next_value"
                              value={card.is_active ? "false" : "true"}
                            />
                            <button
                              type="submit"
                              className="rounded-full border border-[var(--color-line)] px-3 py-2 text-xs font-semibold transition hover:bg-[var(--color-sand)]"
                            >
                              {card.is_active ? "Inativar" : "Ativar"}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-[var(--color-muted)]"
                    >
                      Nenhuma experiencia cadastrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Link
            href="/admin/settings"
            className="rounded-[1.5rem] border border-[var(--color-line)] bg-white p-6 shadow-sm transition hover:bg-[var(--color-sand)]"
          >
            <h3 className="text-lg font-semibold tracking-tight">
              Configuracoes globais
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Ajuste o numero de WhatsApp, titulo do catalogo e mensagem-base da
              consulta.
            </p>
          </Link>

          <Link
            href="/"
            className="rounded-[1.5rem] border border-[var(--color-line)] bg-white p-6 shadow-sm transition hover:bg-[var(--color-sand)]"
          >
            <h3 className="text-lg font-semibold tracking-tight">
              Vitrine publica
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Veja como os cards ativos estao sendo refletidos para o usuario
              final.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
