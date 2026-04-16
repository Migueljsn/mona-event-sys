import type { SettingsRecord } from "@/lib/types";

import { FormField } from "@/components/admin/form-field";
import { TextAreaField } from "@/components/admin/text-area-field";

type SettingsFormProps = {
  settings: SettingsRecord;
  action: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
};

export function SettingsForm({
  settings,
  action,
  disabled = false,
}: SettingsFormProps) {
  return (
    <form action={action} className="grid gap-6">
      <input type="hidden" name="id" value={settings.id} />

      {disabled ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          O painel está em modo bootstrap. Configure o Supabase para salvar
          ajustes reais no projeto.
        </div>
      ) : null}

      <FormField
        label="Número do WhatsApp"
        name="business_whatsapp_number"
        required
        defaultValue={settings.business_whatsapp_number}
        placeholder="5585999999999"
        helpText="Número que receberá todas as consultas. Use formato com código do país e DDD, sem espaços."
      />

      <FormField
        label="Título do catálogo"
        name="catalog_title"
        required
        defaultValue={settings.catalog_title}
        helpText="Título principal exibido no topo da vitrine pública."
      />

      <TextAreaField
        label="Subtítulo do catálogo"
        name="catalog_subtitle"
        defaultValue={settings.catalog_subtitle}
        rows={3}
        helpText="Texto complementar abaixo do título do catálogo, usado para explicar a proposta da página."
      />

      <FormField
        label="Texto do botão principal"
        name="reservation_button_label"
        required
        defaultValue={settings.reservation_button_label}
        helpText="Texto do botão que o usuário usa para consultar as reservas pelo WhatsApp."
      />

      <TextAreaField
        label="Intro da mensagem do WhatsApp"
        name="whatsapp_message_intro"
        defaultValue={settings.whatsapp_message_intro}
        rows={4}
        helpText="Frase inicial da mensagem enviada ao WhatsApp antes da lista de experiências do carrinho."
      />

      <hr className="border-[var(--color-line)]" />

      <div>
        <p className="text-sm font-semibold text-[var(--color-ink)]">Rastreamento e analytics</p>
        <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
          Os scripts são injetados apenas na vitrine pública. Deixe em branco os serviços que não utiliza.
        </p>
      </div>

      <FormField
        label="Google Tag Manager — ID"
        name="gtm_id"
        defaultValue={settings.gtm_id ?? ""}
        placeholder="GTM-XXXXXXX"
        helpText="Recomendado. Um único ID gerencia GA4, Google Ads, Meta e outros via painel do GTM."
      />

      <FormField
        label="Meta Pixel — ID"
        name="meta_pixel_id"
        defaultValue={settings.meta_pixel_id ?? ""}
        placeholder="1234567890123456"
        helpText="ID numérico do pixel do Meta (Facebook/Instagram). Dispara PageView, ViewContent, AddToCart e InitiateCheckout automaticamente."
      />

      <FormField
        label="Google Ads — ID de conversão"
        name="google_ads_id"
        defaultValue={settings.google_ads_id ?? ""}
        placeholder="AW-XXXXXXXXXX"
        helpText="Use apenas se não estiver usando GTM. Se o GTM já estiver configurado, gerencie a tag do Google Ads por lá."
      />

      <button
        type="submit"
        disabled={disabled}
        className="w-fit rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Salvar configurações
      </button>
    </form>
  );
}
