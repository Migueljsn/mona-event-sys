"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { slugify } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeOptional(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
}

function normalizeRequired(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function createCardAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const title = normalizeRequired(formData.get("title"));
  const explicitSlug = normalizeRequired(formData.get("slug"));
  const slug = slugify(explicitSlug || title);

  const payload = {
    title,
    slug,
    short_description: normalizeOptional(formData.get("short_description")),
    long_description: normalizeOptional(formData.get("long_description")),
    additional_info: normalizeOptional(formData.get("additional_info")),
    image_url: normalizeOptional(formData.get("image_url")),
    price_text: normalizeOptional(formData.get("price_text")),
    price_prefix:
      normalizeOptional(formData.get("price_prefix")) ?? "a partir de",
    button_label: normalizeRequired(formData.get("button_label")) || "Saiba mais",
    unit_label: normalizeRequired(formData.get("unit_label")) || "unidade",
    min_quantity: parseNumber(formData.get("min_quantity"), 1),
    max_quantity: parseNumber(formData.get("max_quantity"), 1),
    quantity_step: parseNumber(formData.get("quantity_step"), 1),
    display_order: parseNumber(formData.get("display_order"), 0),
    valid_until: normalizeOptional(formData.get("valid_until")),
    is_active: formData.get("is_active") === "on",
  };

  const { error } = await supabase.from("cards").insert(payload);

  if (error) {
    throw new Error(`Failed to create card: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateCardAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const id = normalizeRequired(formData.get("id"));
  const title = normalizeRequired(formData.get("title"));
  const explicitSlug = normalizeRequired(formData.get("slug"));
  const slug = slugify(explicitSlug || title);

  const payload = {
    title,
    slug,
    short_description: normalizeOptional(formData.get("short_description")),
    long_description: normalizeOptional(formData.get("long_description")),
    additional_info: normalizeOptional(formData.get("additional_info")),
    image_url: normalizeOptional(formData.get("image_url")),
    price_text: normalizeOptional(formData.get("price_text")),
    price_prefix:
      normalizeOptional(formData.get("price_prefix")) ?? "a partir de",
    button_label: normalizeRequired(formData.get("button_label")) || "Saiba mais",
    unit_label: normalizeRequired(formData.get("unit_label")) || "unidade",
    min_quantity: parseNumber(formData.get("min_quantity"), 1),
    max_quantity: parseNumber(formData.get("max_quantity"), 1),
    quantity_step: parseNumber(formData.get("quantity_step"), 1),
    display_order: parseNumber(formData.get("display_order"), 0),
    valid_until: normalizeOptional(formData.get("valid_until")),
    is_active: formData.get("is_active") === "on",
  };

  const { error } = await supabase.from("cards").update(payload).eq("id", id);

  if (error) {
    throw new Error(`Failed to update card: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteCardAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const id = normalizeRequired(formData.get("id"));

  const { error } = await supabase.from("cards").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete card: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function toggleCardStatusAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const id = normalizeRequired(formData.get("id"));
  const nextValue = formData.get("next_value") === "true";

  const { error } = await supabase
    .from("cards")
    .update({ is_active: nextValue })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to toggle card status: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateSettingsAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const id = normalizeRequired(formData.get("id"));

  const payload = {
    business_whatsapp_number: normalizeRequired(
      formData.get("business_whatsapp_number"),
    ),
    catalog_title:
      normalizeRequired(formData.get("catalog_title")) ||
      "Selecione a sua experiencia",
    catalog_subtitle: normalizeOptional(formData.get("catalog_subtitle")),
    reservation_button_label:
      normalizeRequired(formData.get("reservation_button_label")) ||
      "Consultar reservas",
    whatsapp_message_intro:
      normalizeRequired(formData.get("whatsapp_message_intro")) ||
      "Ola! Tenho interesse nas seguintes experiencias:",
  };

  const { error } = await supabase.from("settings").update(payload).eq("id", id);

  if (error) {
    throw new Error(`Failed to update settings: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  redirect("/admin/settings");
}
