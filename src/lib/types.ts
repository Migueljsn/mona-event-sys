export type CardRecord = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  long_description: string | null;
  additional_info: string | null;
  image_url: string | null;
  price_text: string | null;
  price_prefix: string | null;
  button_label: string;
  unit_label: string;
  min_quantity: number;
  max_quantity: number;
  quantity_step: number;
  is_active: boolean;
  display_order: number;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
};

export type SettingsRecord = {
  id: string;
  business_whatsapp_number: string;
  catalog_title: string;
  catalog_subtitle: string | null;
  reservation_button_label: string;
  whatsapp_message_intro: string;
  created_at: string;
  updated_at: string;
};

export type CartItem = {
  card_id: string;
  title: string;
  quantity: number;
  unit_label: string;
  price_text: string | null;
  image_url: string | null;
};
