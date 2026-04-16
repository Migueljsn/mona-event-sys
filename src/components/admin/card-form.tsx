"use client";

import { useRef, useState, useTransition } from "react";

import type { CardRecord } from "@/lib/types";
import { formatDateForInput } from "@/lib/format";

import { FormField } from "@/components/admin/form-field";
import { ImageEditorField } from "@/components/admin/image-editor-field";
import { PriceField } from "@/components/admin/price-field";
import { TextAreaField } from "@/components/admin/text-area-field";

type CardFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  card?: CardRecord | null;
  submitLabel: string;
  disabled?: boolean;
};

export function CardForm({
  action,
  card,
  submitLabel,
  disabled = false,
}: CardFormProps) {
  /**
   * Armazena o File processado pelo ImageEditorField.
   * Usamos ref (não state) para não causar re-render ao trocar o arquivo.
   */
  const imageFileRef = useRef<File | null>(null);
  const [isPending, startTransition] = useTransition();
  // Sem data de fim: se o card não tiver valid_until, já começa marcado
  const [noExpiry, setNoExpiry] = useState(!card?.valid_until);

  function handleFileReady(file: File | null) {
    imageFileRef.current = file;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;

    const formData = new FormData(event.currentTarget);

    /**
     * Injeta o arquivo diretamente no FormData aqui — muito mais confiável
     * do que a abordagem de atribuição via DataTransfer em um input oculto,
     * que pode ser descartada pelo browser antes da submissão.
     */
    const file = imageFileRef.current;
    if (file) {
      formData.set("image_file", file, file.name);
    }

    startTransition(async () => {
      await action(formData);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8">
      {card ? <input type="hidden" name="id" value={card.id} /> : null}
      {card ? (
        <input
          type="hidden"
          name="current_image_url"
          value={card.image_url ?? ""}
        />
      ) : null}

      {disabled ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          O painel está em modo bootstrap. Configure o Supabase para habilitar
          criação e edição persistentes.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Título"
          name="title"
          required
          defaultValue={card?.title}
          placeholder="Buffet Feijoada 8 estrelas"
          helpText="Nome principal da experiência. É o texto que aparece no card e identifica o item para o usuário."
        />
        <FormField
          label="Slug"
          name="slug"
          defaultValue={card?.slug}
          placeholder="buffet-feijoada-8-estrelas"
          helpText="Identificador da experiência. Se você deixar vazio, o sistema tenta gerar a partir do título."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <PriceField
          label="Preço exibido"
          name="price_text"
          defaultValue={card?.price_text}
          placeholder="R$ 0,00"
          helpText="Valor visual mostrado no card e no detalhe. Este campo usa máscara em reais e não faz cálculo financeiro."
        />
        <FormField
          label="Prefixo do preço"
          name="price_prefix"
          defaultValue={card?.price_prefix ?? "a partir de"}
          placeholder="a partir de"
          helpText="Texto curto exibido acima do preço, como 'a partir de'."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Texto do botão"
          name="button_label"
          required
          defaultValue={card?.button_label ?? "Saiba mais"}
          placeholder="Saiba mais"
          helpText="Texto exibido no botão do card. Exemplo: 'Saiba mais' ou 'Ver detalhes'."
        />
        <FormField
          label="Unidade"
          name="unit_label"
          required
          defaultValue={card?.unit_label ?? "unidade"}
          placeholder="unidade"
          helpText="Nome da unidade da experiência, como unidade, pessoa, casal ou voucher."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <FormField
          label="Quantidade mínima"
          name="min_quantity"
          type="number"
          required
          defaultValue={card?.min_quantity ?? 1}
          helpText="Menor quantidade que o usuário pode selecionar para esta experiência."
        />
        <FormField
          label="Quantidade máxima"
          name="max_quantity"
          type="number"
          required
          defaultValue={card?.max_quantity ?? 1}
          helpText="Maior quantidade que o usuário pode selecionar. Não controla estoque real; apenas limita a seleção no front."
        />
        <FormField
          label="Passo"
          name="quantity_step"
          type="number"
          required
          defaultValue={card?.quantity_step ?? 1}
          helpText="Define de quantas em quantas unidades a quantidade aumenta ou diminui. Exemplo: 1, 2 ou 5."
        />
        <FormField
          label="Ordem"
          name="display_order"
          type="number"
          required
          defaultValue={card?.display_order ?? 0}
          helpText="Posição do card na vitrine. Valores menores aparecem antes."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <ImageEditorField
          initialImageUrl={card?.image_url}
          disabled={disabled}
          onFileReady={handleFileReady}
        />
        <FormField
          label="URL da imagem"
          name="image_url"
          defaultValue={card?.image_url ?? ""}
          placeholder="https://..."
          helpText="Fallback manual para imagem. Se um arquivo for enviado pelo editor, ele terá prioridade sobre esta URL."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-3">
          <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-sand)] px-4 py-3">
            <input
              type="checkbox"
              checked={noExpiry}
              onChange={(e) => setNoExpiry(e.target.checked)}
              className="size-4"
            />
            <span className="text-sm font-medium text-[var(--color-ink)]">
              Evento sem data de fim
            </span>
          </label>

          {!noExpiry && (
            <FormField
              label="Válido até"
              name="valid_until"
              type="date"
              defaultValue={formatDateForInput(card?.valid_until ?? null)}
              helpText="Depois dessa data o card deixa de aparecer na vitrine e consta como expirado no admin."
            />
          )}

          {/* Campo oculto para garantir valid_until = "" quando sem data de fim */}
          {noExpiry && (
            <input type="hidden" name="valid_until" value="" />
          )}
        </div>
      </section>

      <TextAreaField
        label="Descrição curta"
        name="short_description"
        defaultValue={card?.short_description}
        placeholder="Texto resumido para o card"
        rows={3}
        helpText="Resumo curto usado na vitrine para apresentar a experiência rapidamente."
      />

      <TextAreaField
        label="Descrição detalhada"
        name="long_description"
        defaultValue={card?.long_description}
        placeholder="Detalhes da experiência exibidos no modal"
        rows={6}
        helpText="Descrição mais completa da experiência. Será usada na área detalhada e no modal."
      />

      <TextAreaField
        label="Informações adicionais"
        name="additional_info"
        defaultValue={card?.additional_info}
        placeholder="Observações, validade, inclusões e regras"
        rows={5}
        helpText="Campo para regras, observações, itens inclusos, validade ou outras condições relevantes."
      />

      <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-sand)] px-4 py-3">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={card?.is_active ?? true}
          className="size-4"
        />
        <span className="text-sm font-medium text-[var(--color-ink)]">
          Card ativo na vitrine pública
        </span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={disabled || isPending}
          className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
