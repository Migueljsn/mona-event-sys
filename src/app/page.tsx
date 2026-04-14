import Link from "next/link";

import { getPublicCards, getSettings } from "@/lib/data/cards";

export default async function Home() {
  const [settings, cards] = await Promise.all([getSettings(), getPublicCards()]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ef,_#f5efe7_55%,_#efe5db)] px-6 py-10 text-[var(--color-ink)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-[0_20px_60px_rgba(61,36,23,0.08)] backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-[var(--color-line)] bg-[var(--color-sand)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Catalogo publico
              </span>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
                {settings.catalog_title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)] md:text-lg">
                {settings.catalog_subtitle ??
                  "Aproveite o melhor do hotel do seu jeito preferido."}
              </p>
            </div>

            <div className="flex flex-col gap-3 md:items-end">
              <Link
                href="/admin"
                className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Abrir painel admin
              </Link>
              <p className="text-sm text-[var(--color-muted)]">
                WhatsApp de atendimento: {settings.business_whatsapp_number}
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.length ? (
            cards.map((card) => (
              <article
                key={card.id}
                className="rounded-[1.75rem] border border-white/80 bg-white/85 p-6 shadow-[0_16px_40px_rgba(61,36,23,0.06)]"
              >
                <div className="aspect-[4/3] rounded-[1.25rem] bg-[linear-gradient(135deg,_#d9b298,_#f4e2d1)]" />
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">
                      {card.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                      {card.short_description ?? "Descricao em configuracao."}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                      {card.price_prefix}
                    </p>
                    <strong className="text-lg font-semibold">
                      {card.price_text ?? "-"}
                    </strong>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <span className="text-xs text-[var(--color-muted)]">
                    {card.min_quantity} a {card.max_quantity} {card.unit_label}
                  </span>
                  <button className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--color-sand)]">
                    {card.button_label}
                  </button>
                </div>
              </article>
            ))
          ) : (
            <article className="rounded-[2rem] border border-[var(--color-line)] bg-white p-8 shadow-[0_18px_45px_rgba(61,36,23,0.06)] md:col-span-2 xl:col-span-3">
              <h2 className="text-2xl font-semibold tracking-tight">
                Nenhuma experiencia ativa ainda
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
                O banco ja esta conectado. O proximo passo e criar o usuario do
                admin e cadastrar os primeiros cards para alimentar a vitrine.
              </p>
            </article>
          )}
        </section>
      </div>
    </main>
  );
}
