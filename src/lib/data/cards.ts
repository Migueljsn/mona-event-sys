import { cache } from "react";

import { isCardExpired } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CardRecord, SettingsRecord } from "@/lib/types";

export const getPublicCards = cache(async () => {
  const supabase = await createSupabaseServerClient();

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
});

export const getAdminCards = cache(async () => {
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
});

export const getAdminCardById = cache(async (id: string) => {
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
});

export const getSettings = cache(async () => {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("settings").select("*").single();

  if (error) {
    throw new Error(`Failed to load settings: ${error.message}`);
  }

  return data as SettingsRecord;
});
