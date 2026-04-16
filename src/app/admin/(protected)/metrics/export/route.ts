import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!hasSupabaseEnv()) redirect("/admin/metrics");

  const supabase = await createSupabaseServerClient();

  // Verifica autenticação
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/admin/login");

  const { searchParams } = new URL(request.url);
  const all  = searchParams.get("from") === "all";
  const from = all ? null : (searchParams.get("from") ?? null);
  const to   = all ? null : (searchParams.get("to")   ?? null);

  let query = supabase
    .from("card_events")
    .select(`
      id,
      event_type,
      session_id,
      device,
      os,
      browser,
      referrer,
      utm_source,
      utm_medium,
      utm_campaign,
      screen,
      language,
      created_at,
      cards ( title, slug )
    `)
    .order("created_at", { ascending: false });

  if (from) query = query.gte("created_at", `${from}T00:00:00.000Z`);
  if (to)   query = query.lte("created_at", `${to}T23:59:59.999Z`);

  const { data: events } = await query;

  if (!events || events.length === 0) {
    return new Response("Nenhum evento encontrado para o período.", { status: 204 });
  }

  // Gera CSV
  const headers = [
    "id", "data", "hora", "experiencia", "slug",
    "evento", "sessao", "dispositivo", "sistema", "navegador",
    "origem", "utm_source", "utm_medium", "utm_campaign",
    "resolucao", "idioma",
  ];

  function escapeCell(value: unknown): string {
    const str = value == null ? "" : String(value);
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  }

  const lines = [
    headers.join(","),
    ...events.map((e) => {
      const card = Array.isArray(e.cards) ? e.cards[0] : e.cards;
      const dt = new Date(e.created_at);
      return [
        e.id,
        dt.toLocaleDateString("pt-BR"),
        dt.toLocaleTimeString("pt-BR"),
        card?.title ?? "",
        card?.slug  ?? "",
        e.event_type,
        e.session_id ?? "",
        e.device     ?? "",
        e.os         ?? "",
        e.browser    ?? "",
        e.referrer   ?? "",
        e.utm_source   ?? "",
        e.utm_medium   ?? "",
        e.utm_campaign ?? "",
        e.screen    ?? "",
        e.language  ?? "",
      ].map(escapeCell).join(",");
    }),
  ];

  const csv = lines.join("\n");
  const dateLabel = all ? "historico-completo" : `${from ?? "inicio"}_${to ?? "hoje"}`;
  const filename  = `mona-metricas-${dateLabel}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
