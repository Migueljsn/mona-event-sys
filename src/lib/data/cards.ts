import { cache } from "react";

import { bootstrapCards, bootstrapSettings } from "@/lib/bootstrap-data";
import { hasSupabaseEnv } from "@/lib/env";
import { isCardExpired } from "@/lib/format";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CardRecord, SettingsRecord } from "@/lib/types";

async function withFallback<T>(loader: () => Promise<T>, fallback: T) {
  if (!hasSupabaseEnv()) {
    return fallback;
  }

  try {
    return await loader();
  } catch (error) {
    console.warn("Supabase data fallback enabled:", error);
    return fallback;
  }
}

export const getPublicCards = cache(async () => {
  return withFallback(async () => {
    const supabase = createSupabasePublicClient();

    const { data, error } = await supabase
      .from("cards")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to load public cards: ${error.message}`);
    }

    const cards = (data ?? []) as CardRecord[];

    return cards.filter((card) => !isCardExpired(card.valid_until));
  }, bootstrapCards.filter((card) => !isCardExpired(card.valid_until)));
});

export const getAdminCards = cache(async () => {
  return withFallback(async () => {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("cards")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to load admin cards: ${error.message}`);
    }

    return (data ?? []) as CardRecord[];
  }, bootstrapCards);
});

export const getAdminCardById = cache(async (id: string) => {
  return withFallback(async () => {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("cards")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return null;
    }

    return data as CardRecord;
  }, bootstrapCards.find((card) => card.id === id) ?? null);
});

export const getSettings = cache(async () => {
  return withFallback(async () => {
    const supabase = createSupabasePublicClient();

    const { data, error } = await supabase.from("settings").select("*").single();

    if (error) {
      throw new Error(`Failed to load settings: ${error.message}`);
    }

    return data as SettingsRecord;
  }, bootstrapSettings);
});
