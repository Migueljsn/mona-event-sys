"use server";

import { hasSupabaseEnv } from "@/lib/env";
import { createSupabasePublicClient } from "@/lib/supabase/public";

type EventType = "click" | "add_to_cart" | "whatsapp";

type TrackPayload = {
  cardId: string;
  eventType: EventType;
  sessionId: string;
  userAgent: string;
  referrer: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  screen: string;
  language: string;
};

function parseUA(ua: string) {
  const lower = ua.toLowerCase();

  const isTablet = /tablet|ipad/.test(lower);
  const isMobile = /mobile|android|iphone|ipod/.test(lower);
  const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  let os = "Outro";
  if (/iphone|ipad|ipod/.test(lower)) os = "iOS";
  else if (/android/.test(lower)) os = "Android";
  else if (/windows/.test(lower)) os = "Windows";
  else if (/mac os x/.test(lower)) os = "macOS";
  else if (/linux/.test(lower)) os = "Linux";

  let browser = "Outro";
  if (/edg\//.test(lower)) browser = "Edge";
  else if (/opr|opera/.test(lower)) browser = "Opera";
  else if (/chrome/.test(lower)) browser = "Chrome";
  else if (/safari/.test(lower)) browser = "Safari";
  else if (/firefox/.test(lower)) browser = "Firefox";

  return { device, os, browser };
}

export async function trackCardEventAction(payload: TrackPayload) {
  if (!hasSupabaseEnv()) return;

  try {
    const { device, os, browser } = parseUA(payload.userAgent);
    const supabase = createSupabasePublicClient();

    await supabase.from("card_events").insert({
      card_id:      payload.cardId,
      event_type:   payload.eventType,
      session_id:   payload.sessionId,
      device,
      os,
      browser,
      referrer:     payload.referrer || "direct",
      utm_source:   payload.utmSource,
      utm_medium:   payload.utmMedium,
      utm_campaign: payload.utmCampaign,
      screen:       payload.screen,
      language:     payload.language,
    });
  } catch {
    // Fire-and-forget — silencia erros para não impactar a vitrine
  }
}
