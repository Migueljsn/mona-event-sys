import type { CardRecord } from "@/lib/types";
import { formatDateForInput } from "@/lib/format";

import { FormField } from "@/components/admin/form-field";
import { PriceField } from "@/components/admin/price-field";
import { TextAreaField } from "@/components/admin/text-area-field";

type CardFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  card?: CardRecord | null;
  submitLabel: string;
};

export function CardForm({ action, card, submitLabel }: CardFormProps) {
  return (
    <form action={action} className="grid gap-8">
      {card ? <input type="hidden" name="id" value={card.id} /> : null}

      <section className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Titulo"
          name="title"
          required
          defaultValue={card?.title}
          placeholder="Buffet Feijoada 8 estrelas"
          helpText="Nome principal da experiencia. E o texto que aparece no card e identifica o item para o usuario."
        />
        <FormField
          label="Slug"
          name="slug"
          defaultValue={card?.slug}
          placeholder="buffet-feijoada-8-estrelas"
          helpText="Identificador da experiencia. Se voce deixar vazio, o sistema tenta gerar a partir do titulo."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <PriceField
          label="Preco exibido"
          name="price_text"
          defaultValue={card?.price_text}
          placeholder="R$ 0,00"
          helpText="Valor visual mostrado no card e no detalhe. Este campo usa mascara em reais e nao faz calculo financeiro."
        />
        <FormField
          label="Prefixo do preco"
          name="price_prefix"
          defaultValue={card?.price_prefix ?? "a partir de"}
          placeholder="a partir de"
          helpText="Texto curto exibido acima do preco, como 'a partir de'."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Texto do botao"
          name="button_label"
          required
          defaultValue={card?.button_label ?? "Saiba mais"}
          placeholder="Saiba mais"
          helpText="Texto exibido no botao do card. Exemplo: 'Saiba mais' ou 'Ver detalhes'."
        />
        <FormField
          label="Unidade"
          name="unit_label"
          required
          defaultValue={card?.unit_label ?? "unidade"}
          placeholder="unidade"
          helpText="Nome da unidade da experiencia, como unidade, pessoa, casal ou voucher."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <FormField
          label="Quantidade minima"
          name="min_quantity"
          type="number"
          required
          defaultValue={card?.min_quantity ?? 1}
          helpText="Menor quantidade que o usuario pode selecionar para esta experiencia."
        />
        <FormField
          label="Quantidade maxima"
          name="max_quantity"
          type="number"
          required
          defaultValue={card?.max_quantity ?? 1}
          helpText="Maior quantidade que o usuario pode selecionar. Nao controla estoque real; apenas limita a selecao no front."
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
          helpText="Posicao do card na vitrine. Valores menores aparecem antes."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <FormField
          label="URL da imagem"
          name="image_url"
          defaultValue={card?.image_url ?? ""}
          placeholder="https://..."
          helpText="Endereco da imagem exibida no card. Nesta etapa o sistema ainda trabalha com URL manual."
        />
        <FormField
          label="Valido ate"
          name="valid_until"
          type="date"
          defaultValue={formatDateForInput(card?.valid_until ?? null)}
          helpText="Data limite da experiencia. Depois dessa data, o card deixa de aparecer na vitrine publica e passa a constar como expirado no admin."
        />
      </section>

      <TextAreaField
        label="Descricao curta"
        name="short_description"
        defaultValue={card?.short_description}
        placeholder="Texto resumido para o card"
        rows={3}
        helpText="Resumo curto usado na vitrine para apresentar a experiencia rapidamente."
      />

      <TextAreaField
        label="Descricao detalhada"
        name="long_description"
        defaultValue={card?.long_description}
        placeholder="Detalhes da experiencia exibidos no modal"
        rows={6}
        helpText="Descricao mais completa da experiencia. Sera usada na area detalhada e no modal."
      />

      <TextAreaField
        label="Informacoes adicionais"
        name="additional_info"
        defaultValue={card?.additional_info}
        placeholder="Observacoes, validade, inclusoes e regras"
        rows={5}
        helpText="Campo para regras, observacoes, itens inclusos, validade ou outras condicoes relevantes."
      />

      <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-sand)] px-4 py-3">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={card?.is_active ?? true}
          className="size-4"
        />
        <span className="text-sm font-medium text-[var(--color-ink)]">
          Card ativo na vitrine publica
        </span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
