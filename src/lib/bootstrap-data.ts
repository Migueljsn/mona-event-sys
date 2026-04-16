import type { CardRecord, SettingsRecord } from "@/lib/types";

export const bootstrapSettings: SettingsRecord = {
  id: "bootstrap-settings",
  business_whatsapp_number: "5585000000000",
  catalog_title: "Selecione a sua experiencia",
  catalog_subtitle:
    "Monte sua consulta, combine itens no carrinho e finalize o atendimento pelo WhatsApp.",
  reservation_button_label: "Consultar reservas",
  whatsapp_message_intro: "Ola! Tenho interesse nas seguintes experiencias:",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

export const bootstrapCards: CardRecord[] = [
  {
    id: "bootstrap-feijoada",
    title: "Buffet Feijoada 8 estrelas",
    slug: "buffet-feijoada-8-estrelas",
    short_description:
      "Almoco tematico com buffet completo, sobremesas e ambientacao especial.",
    long_description:
      "Uma experiencia gastronomica pensada para grupos, familias e hospedagens especiais. Inclui buffet completo, sobremesas selecionadas e atendimento dedicado.",
    additional_info:
      "Disponivel aos sabados. Sujeito a agenda e confirmacao manual da equipe comercial.",
    image_url:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
    price_text: "R$ 189,00",
    price_prefix: "a partir de",
    button_label: "Saiba mais",
    unit_label: "reserva",
    min_quantity: 1,
    max_quantity: 8,
    quantity_step: 1,
    is_active: true,
    display_order: 1,
    valid_until: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "bootstrap-day-spa",
    title: "Day Spa",
    slug: "day-spa",
    short_description:
      "Circuito relaxante com massagem, area umida e pausa para cha da tarde.",
    long_description:
      "Perfeito para escapadas curtas. A experiencia combina bem-estar, pausa guiada e atendimento individualizado para quem quer relaxar por algumas horas.",
    additional_info:
      "Atendimento mediante disponibilidade. Consulte restricoes e horarios diretamente com a equipe.",
    image_url:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80",
    price_text: "R$ 320,00",
    price_prefix: "por pessoa",
    button_label: "Saiba mais",
    unit_label: "pessoa",
    min_quantity: 1,
    max_quantity: 4,
    quantity_step: 1,
    is_active: true,
    display_order: 2,
    valid_until: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "bootstrap-romance",
    title: "Noite Romantica",
    slug: "noite-romantica",
    short_description:
      "Pacote com decoracao especial, amenidades e atendimento dedicado.",
    long_description:
      "Experiencia criada para datas especiais, com montagem romantica, amenities selecionadas e acompanhamento do time para personalizacao.",
    additional_info:
      "Pode ser combinada com hospedagem, jantar ou servicos extras mediante consulta.",
    image_url:
      "https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=1200&q=80",
    price_text: "R$ 540,00",
    price_prefix: "pacote",
    button_label: "Saiba mais",
    unit_label: "pacote",
    min_quantity: 1,
    max_quantity: 2,
    quantity_step: 1,
    is_active: true,
    display_order: 3,
    valid_until: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];
