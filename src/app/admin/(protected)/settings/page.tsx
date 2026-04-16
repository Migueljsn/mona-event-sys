import Link from "next/link";

import { updateSettingsAction } from "@/app/admin/(protected)/actions";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/data/cards";
import { hasSupabaseEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <main className="px-6 py-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Configuracoes
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Ajustes globais do sistema
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
              Aqui você define o número de WhatsApp, textos do catálogo e a base
              da mensagem enviada na consulta.
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
          <SettingsForm
            settings={settings}
            action={updateSettingsAction}
            disabled={!hasSupabaseEnv()}
          />
        </section>
      </div>
    </main>
  );
}
