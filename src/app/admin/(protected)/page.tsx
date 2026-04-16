import Link from "next/link";

import { toggleCardStatusAction } from "@/app/admin/(protected)/actions";
import { getAdminCards, getSettings } from "@/lib/data/cards";
import { hasSupabaseEnv } from "@/lib/env";
import { getCardStatus } from "@/lib/format";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Ativo: "bg-green-50 text-green-700 border-green-200",
    Inativo: "bg-gray-50 text-gray-600 border-gray-200",
    Expirado: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status] ?? styles["Inativo"]}`}
    >
      {status}
    </span>
  );
}

export default async function AdminPage() {
  const [cards, settings] = await Promise.all([getAdminCards(), getSettings()]);
  const isConfigured = hasSupabaseEnv();
  const activeCards = cards.filter((card) => getCardStatus(card) === "Ativo").length;
  const expiredCards = cards.filter(
    (card) => getCardStatus(card) === "Expirado",
  ).length;

  return (
    <main className="px-6 py-12 text-[var(--color-ink)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <span className="w-fit rounded-full border border-[var(--color-line)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
            Área interna autenticada
          </span>
          <h1 className="text-4xl font-semibold tracking-tight">
            Painel administrativo
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--color-muted)]">
            Gerencie as experiências, controle a visibilidade na vitrine e ajuste
            as configurações globais do catálogo.
          </p>
        </header>

        {!isConfigured ? (
          <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950">
            O projeto está operando em modo bootstrap. A leitura usa dados de
            exemplo para manter a aplicação funcional, mas o CRUD real depende
            das variáveis do Supabase em <code>.env.local</code>.
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          <article className="rounded-3xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-[var(--color-muted)]">
              Total de experiências
            </p>
            <strong className="mt-3 block text-4xl font-semibold">
              {cards.length}
            </strong>
          </article>

          <article className="rounded-3xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-[var(--color-muted)]">
              Experiências ativas
            </p>
            <strong className="mt-3 block text-4xl font-semibold text-green-600">
              {activeCards}
            </strong>
          </article>

          <article className="rounded-3xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-[var(--color-muted)]">
              Expiradas
            </p>
            <strong className="mt-3 block text-4xl font-semibold text-amber-600">
              {expiredCards}
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
        </section>

        <section className="rounded-[2rem] border border-[var(--color-line)] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Experiências cadastradas
              </h2>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Clique em <strong>Editar</strong> para alterar conteúdo ou use os
                botões de ativação rápida na tabela.
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
                  <th className="px-4 py-3 font-medium">Imagem</th>
                  <th className="px-4 py-3 font-medium">Título</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Quantidade</th>
                  <th className="px-4 py-3 font-medium">Ordem</th>
                  <th className="px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)] bg-white">
                {cards.length ? (
                  cards.map((card) => (
                    <tr key={card.id} className="transition hover:bg-[var(--color-sand)]/40">
                      <td className="px-4 py-3">
                        <div
                          className="h-9 w-12 overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-sand)] bg-cover bg-center"
                          style={{
                            backgroundImage: card.image_url
                              ? `url(${card.image_url})`
                              : "linear-gradient(135deg,#d9b298,#f4e2d1)",
                          }}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium">{card.title}</div>
                        <div className="text-xs text-[var(--color-muted)]">
                          /{card.slug}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={getCardStatus(card)} />
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
                              disabled={!isConfigured}
                              className="rounded-full border border-[var(--color-line)] px-3 py-2 text-xs font-semibold transition hover:bg-[var(--color-sand)] disabled:opacity-50"
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
                      colSpan={6}
                      className="px-4 py-10 text-center text-[var(--color-muted)]"
                    >
                      Nenhuma experiência cadastrada ainda.
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
              Configurações globais
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Ajuste o número de WhatsApp, título do catálogo e mensagem-base da
              consulta.
            </p>
          </Link>

          <Link
            href="/"
            className="rounded-[1.5rem] border border-[var(--color-line)] bg-white p-6 shadow-sm transition hover:bg-[var(--color-sand)]"
          >
            <h3 className="text-lg font-semibold tracking-tight">
              Vitrine pública
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Veja como os cards ativos estão sendo exibidos para o usuário
              final.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
