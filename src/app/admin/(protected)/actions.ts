"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/env";
import { slugify } from "@/lib/format";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const CARD_IMAGES_BUCKET = "card-images";
const MAX_IMAGE_FILE_SIZE_BYTES = 400 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function assertSupabaseConfigured() {
  if (!hasSupabaseEnv()) {
    throw new Error(
      "Supabase não configurado. Defina as variáveis em .env.local antes de salvar alterações no admin.",
    );
  }
}

function assertSupabaseAdminConfigured() {
  if (!hasSupabaseAdminEnv()) {
    throw new Error(
      "Supabase admin não configurado. Defina também a SUPABASE_SERVICE_ROLE_KEY para upload de imagens.",
    );
  }
}

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

function getFileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();

  if (fromName) {
    return fromName;
  }

  switch (file.type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

async function ensureCardImagesBucket() {
  assertSupabaseAdminConfigured();

  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin.storage.getBucket(CARD_IMAGES_BUCKET);

  if (data && !error) {
    return supabaseAdmin;
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(
    CARD_IMAGES_BUCKET,
    {
      public: true,
      fileSizeLimit: `${MAX_IMAGE_FILE_SIZE_BYTES}`,
      allowedMimeTypes: ALLOWED_IMAGE_TYPES,
    },
  );

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(`Falha ao preparar o bucket de imagens: ${createError.message}`);
  }

  return supabaseAdmin;
}

async function deleteOldCardImage(
  oldImageUrl: string,
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
) {
  const marker = `/object/public/${CARD_IMAGES_BUCKET}/`;
  const idx = oldImageUrl.indexOf(marker);
  if (idx === -1) return;
  const filePath = oldImageUrl.slice(idx + marker.length);
  // Deleção não-crítica: ignora erros para não bloquear a atualização do card
  await supabaseAdmin.storage.from(CARD_IMAGES_BUCKET).remove([filePath]);
}

async function resolveCardImageUrl(
  formData: FormData,
  slug: string,
  currentImageUrl?: string | null,
) {
  const manualImageUrl = normalizeOptional(formData.get("image_url"));
  const imageFile = formData.get("image_file");

  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return manualImageUrl ?? currentImageUrl ?? null;
  }

  if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
    throw new Error("Formato de imagem inválido. Use JPG, PNG ou WebP.");
  }

  if (imageFile.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    throw new Error("Imagem recusada. O arquivo ultrapassa o limite de 400 KB.");
  }

  const supabaseAdmin = await ensureCardImagesBucket();
  const extension = getFileExtension(imageFile);
  const filePath = `${slug}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(CARD_IMAGES_BUCKET)
    .upload(filePath, imageFile, {
      cacheControl: "3600",
      contentType: imageFile.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Falha ao enviar a imagem: ${uploadError.message}`);
  }

  // Remove imagem anterior do bucket após upload bem-sucedido
  if (currentImageUrl) {
    await deleteOldCardImage(currentImageUrl, supabaseAdmin);
  }

  const { data } = supabaseAdmin.storage
    .from(CARD_IMAGES_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

async function buildCardPayload(
  formData: FormData,
  currentImageUrl?: string | null,
) {
  const title = normalizeRequired(formData.get("title"));
  const explicitSlug = normalizeRequired(formData.get("slug"));
  const slug = slugify(explicitSlug || title);
  const imageUrl = await resolveCardImageUrl(formData, slug, currentImageUrl);

  return {
    title,
    slug,
    short_description: normalizeOptional(formData.get("short_description")),
    long_description: normalizeOptional(formData.get("long_description")),
    additional_info: normalizeOptional(formData.get("additional_info")),
    image_url: imageUrl,
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
}

export async function createCardAction(formData: FormData) {
  assertSupabaseConfigured();
  const supabase = await createSupabaseServerClient();

  const payload = await buildCardPayload(formData);

  const { error } = await supabase.from("cards").insert(payload);

  if (error) {
    throw new Error(`Falha ao criar a experiência: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateCardAction(formData: FormData) {
  assertSupabaseConfigured();
  const supabase = await createSupabaseServerClient();

  const id = normalizeRequired(formData.get("id"));
  const currentImageUrl = normalizeOptional(formData.get("current_image_url"));
  const payload = await buildCardPayload(formData, currentImageUrl);

  const { error } = await supabase.from("cards").update(payload).eq("id", id);

  if (error) {
    throw new Error(`Falha ao atualizar a experiência: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteCardAction(formData: FormData) {
  assertSupabaseConfigured();
  const supabase = await createSupabaseServerClient();
  const id = normalizeRequired(formData.get("id"));

  const { error } = await supabase.from("cards").delete().eq("id", id);

  if (error) {
    throw new Error(`Falha ao excluir a experiência: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function toggleCardStatusAction(formData: FormData) {
  assertSupabaseConfigured();
  const supabase = await createSupabaseServerClient();
  const id = normalizeRequired(formData.get("id"));
  const nextValue = formData.get("next_value") === "true";

  const { error } = await supabase
    .from("cards")
    .update({ is_active: nextValue })
    .eq("id", id);

  if (error) {
    throw new Error(`Falha ao alterar o status do card: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateSettingsAction(formData: FormData) {
  assertSupabaseConfigured();
  const supabase = await createSupabaseServerClient();
  const id = normalizeRequired(formData.get("id"));

  const payload = {
    business_whatsapp_number: normalizeRequired(
      formData.get("business_whatsapp_number"),
    ),
    catalog_title:
      normalizeRequired(formData.get("catalog_title")) ||
      "Selecione a sua experiência",
    catalog_subtitle: normalizeOptional(formData.get("catalog_subtitle")),
    reservation_button_label:
      normalizeRequired(formData.get("reservation_button_label")) ||
      "Consultar reservas",
    whatsapp_message_intro:
      normalizeRequired(formData.get("whatsapp_message_intro")) ||
      "Olá! Tenho interesse nas seguintes experiências:",
  };

  const { error } = await supabase.from("settings").update(payload).eq("id", id);

  if (error) {
    throw new Error(`Falha ao salvar as configurações: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  redirect("/admin/settings");
}
