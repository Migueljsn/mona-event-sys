import type { SettingsRecord } from "@/lib/types";

import { FormField } from "@/components/admin/form-field";
import { TextAreaField } from "@/components/admin/text-area-field";

type SettingsFormProps = {
  settings: SettingsRecord;
  action: (formData: FormData) => void | Promise<void>;
};

export function SettingsForm({ settings, action }: SettingsFormProps) {
  return (
    <form action={action} className="grid gap-6">
      <input type="hidden" name="id" value={settings.id} />

      <FormField
        label="Numero do WhatsApp"
        name="business_whatsapp_number"
        required
        defaultValue={settings.business_whatsapp_number}
        placeholder="5585999999999"
        helpText="Numero que recebera todas as consultas. Use formato com codigo do pais e DDD, sem espacos."
      />

      <FormField
        label="Titulo do catalogo"
        name="catalog_title"
        required
        defaultValue={settings.catalog_title}
        helpText="Titulo principal exibido no topo da vitrine publica."
      />

      <TextAreaField
        label="Subtitulo do catalogo"
        name="catalog_subtitle"
        defaultValue={settings.catalog_subtitle}
        rows={3}
        helpText="Texto complementar abaixo do titulo do catalogo, usado para explicar a proposta da pagina."
      />

      <FormField
        label="Texto do botao principal"
        name="reservation_button_label"
        required
        defaultValue={settings.reservation_button_label}
        helpText="Texto do botao que o usuario usa para consultar as reservas pelo WhatsApp."
      />

      <TextAreaField
        label="Intro da mensagem do WhatsApp"
        name="whatsapp_message_intro"
        defaultValue={settings.whatsapp_message_intro}
        rows={4}
        helpText="Frase inicial da mensagem enviada ao WhatsApp antes da lista de experiencias do carrinho."
      />

      <button
        type="submit"
        className="w-fit rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Salvar configuracoes
      </button>
    </form>
  );
}
