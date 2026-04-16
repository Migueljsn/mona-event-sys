import { MetricsDateFilter } from "@/components/admin/metrics-date-filter";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return toDateString(d);
}

function defaultTo(): string {
  return toDateString(new Date());
}

function daysUntilDeletion(oldest: string): number {
  const deleteDate = new Date(oldest);
  deleteDate.setFullYear(deleteDate.getFullYear() + 1);
  // Próximo dia 1 após deleteDate
  deleteDate.setDate(1);
  deleteDate.setMonth(deleteDate.getMonth() + 1);
  const diff = deleteDate.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function formatMonth(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default async function MetricsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from: rawFrom, to: rawTo } = await searchParams;
  const from = rawFrom ?? defaultFrom();
  const to   = rawTo   ?? defaultTo();

  const isConfigured = hasSupabaseEnv();

  // ── Sem Supabase ────────────────────────────────────────────────────────────
  if (!isConfigured) {
    return (
      <main className="px-6 py-12 text-[var(--color-ink)]">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-semibold tracking-tight">Métricas</h1>
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            Configure o Supabase para visualizar métricas.
          </p>
        </div>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();

  // ── Busca paralela: cards + eventos no período ───────────────────────────────
  const fromTs = `${from}T00:00:00.000Z`;
  const toTs   = `${to}T23:59:59.999Z`;

  const [{ data: cards }, { data: events }, { data: oldestRow }] =
    await Promise.all([
      supabase.from("cards").select("id, title").order("display_order"),
      supabase
        .from("card_events")
        .select("card_id, event_type")
        .gte("created_at", fromTs)
        .lte("created_at", toTs),
      supabase
        .from("card_events")
        .select("created_at")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

  // ── Agrega eventos por card ──────────────────────────────────────────────────
  type Row = { id: string; title: string; clicks: number; cart: number; whatsapp: number };

  const rows: Row[] = (cards ?? []).map((card) => {
    const cardEvents = (events ?? []).filter((e) => e.card_id === card.id);
    const clicks   = cardEvents.filter((e) => e.event_type === "click").length;
    const cart     = cardEvents.filter((e) => e.event_type === "add_to_cart").length;
    const whatsapp = cardEvents.filter((e) => e.event_type === "whatsapp").length;
    return { id: card.id, title: card.title, clicks, cart, whatsapp };
  });

  const totalClicks   = rows.reduce((s, r) => s + r.clicks, 0);
  const totalCart     = rows.reduce((s, r) => s + r.cart, 0);
  const totalWhatsapp = rows.reduce((s, r) => s + r.whatsapp, 0);
  const totalConv     = totalClicks > 0 ? ((totalWhatsapp / totalClicks) * 100).toFixed(1) : "—";

  // ── Banner de dados prestes a expirar ───────────────────────────────────────
  const elevenMonthsAgo = new Date();
  elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 11);
  const showArchiveBanner =
    oldestRow && new Date(oldestRow.created_at) < elevenMonthsAgo;
  const daysLeft = showArchiveBanner
    ? daysUntilDeletion(oldestRow.created_at)
    : 0;

  // ── Export URL ───────────────────────────────────────────────────────────────
  const exportUrl = `/admin/metrics/export?from=${from}&to=${to}`;

  return (
    <main className="px-6 py-12 text-[var(--color-ink)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">

        {/* Cabeçalho */}
        <header className="flex flex-col gap-3">
          <span className="w-fit rounded-full border border-[var(--color-line)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
            Análise de desempenho
          </span>
          <h1 className="text-4xl font-semibold tracking-tight">Métricas</h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--color-muted)]">
            Acompanhe visualizações, adições ao carrinho e finalizações via WhatsApp por experiência.
          </p>
        </header>

        {/* Banner de arquivo */}
        {showArchiveBanner && (
          <section className="flex items-start justify-between gap-4 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            <p>
              <strong>Atenção:</strong> dados de {formatMonth(oldestRow.created_at)} serão
              apagados automaticamente em <strong>{daysLeft} {daysLeft === 1 ? "dia" : "dias"}</strong>.
              Exporte o CSV para não perder o histórico.
            </p>
            <a
              href={`/admin/metrics/export?from=all`}
              className="shrink-0 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-600"
            >
              Exportar tudo
            </a>
          </section>
        )}

        {/* Totalizadores */}
        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Visualizações", value: totalClicks, color: "" },
            { label: "Adições ao carrinho", value: totalCart, color: "text-blue-600" },
            { label: "Finalizações WhatsApp", value: totalWhatsapp, color: "text-green-600" },
            { label: "Conversão geral", value: `${totalConv}${totalConv !== "—" ? "%" : ""}`, color: "text-[var(--color-brand)]" },
          ].map((item) => (
            <article key={item.label} className="rounded-3xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-[var(--color-muted)]">{item.label}</p>
              <strong className={`mt-3 block text-4xl font-semibold ${item.color}`}>
                {item.value}
              </strong>
            </article>
          ))}
        </section>

        {/* Tabela */}
        <section className="rounded-[2rem] border border-[var(--color-line)] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Por experiência</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Conversão = finalizações WhatsApp ÷ visualizações.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <MetricsDateFilter from={from} to={to} />
              <a
                href={exportUrl}
                className="rounded-full border border-[var(--color-line)] px-5 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-sand)]"
              >
                Exportar CSV
              </a>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[var(--color-line)]">
            <table className="min-w-full divide-y divide-[var(--color-line)] text-sm">
              <thead className="bg-[var(--color-sand)] text-left text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Experiência</th>
                  <th className="px-4 py-3 font-medium text-right">Visualizações</th>
                  <th className="px-4 py-3 font-medium text-right">Carrinho</th>
                  <th className="px-4 py-3 font-medium text-right">WhatsApp</th>
                  <th className="px-4 py-3 font-medium text-right">Conversão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)] bg-white">
                {rows.length ? (
                  rows.map((row) => {
                    const conv = row.clicks > 0
                      ? `${((row.whatsapp / row.clicks) * 100).toFixed(1)}%`
                      : "—";
                    return (
                      <tr key={row.id} className="transition hover:bg-[var(--color-sand)]/40">
                        <td className="px-4 py-4 font-medium">{row.title}</td>
                        <td className="px-4 py-4 text-right">{row.clicks}</td>
                        <td className="px-4 py-4 text-right text-blue-600">{row.cart}</td>
                        <td className="px-4 py-4 text-right text-green-600">{row.whatsapp}</td>
                        <td className="px-4 py-4 text-right font-semibold text-[var(--color-brand)]">{conv}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[var(--color-muted)]">
                      Nenhum dado para o período selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  );
}
