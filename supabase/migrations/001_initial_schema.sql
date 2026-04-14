create extension if not exists "pgcrypto";

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  business_whatsapp_number text not null,
  catalog_title text not null default 'Selecione a sua experiencia',
  catalog_subtitle text,
  reservation_button_label text not null default 'Consultar reservas',
  whatsapp_message_intro text not null default 'Ola! Tenho interesse nas seguintes experiencias:',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint settings_single_row check (id is not null)
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text,
  long_description text,
  additional_info text,
  image_url text,
  price_text text,
  price_prefix text default 'a partir de',
  button_label text not null default 'Saiba mais',
  unit_label text not null default 'unidade',
  min_quantity integer not null default 1 check (min_quantity > 0),
  max_quantity integer not null default 1 check (max_quantity > 0),
  quantity_step integer not null default 1 check (quantity_step > 0),
  is_active boolean not null default true,
  display_order integer not null default 0,
  valid_until date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint cards_quantity_bounds check (max_quantity >= min_quantity)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_cards_updated_at on public.cards;
create trigger set_cards_updated_at
before update on public.cards
for each row
execute function public.set_updated_at();

drop trigger if exists set_settings_updated_at on public.settings;
create trigger set_settings_updated_at
before update on public.settings
for each row
execute function public.set_updated_at();

alter table public.cards enable row level security;
alter table public.settings enable row level security;

drop policy if exists "Public can read active cards" on public.cards;
create policy "Public can read active cards"
on public.cards
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Authenticated can manage cards" on public.cards;
create policy "Authenticated can manage cards"
on public.cards
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read settings" on public.settings;
create policy "Public can read settings"
on public.settings
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated can manage settings" on public.settings;
create policy "Authenticated can manage settings"
on public.settings
for all
to authenticated
using (true)
with check (true);

insert into public.settings (
  business_whatsapp_number,
  catalog_title,
  catalog_subtitle,
  reservation_button_label,
  whatsapp_message_intro
)
select
  '5585000000000',
  'Selecione a sua experiencia',
  'Aproveite o melhor do hotel do seu jeito preferido.',
  'Consultar reservas',
  'Ola! Tenho interesse nas seguintes experiencias:'
where not exists (
  select 1 from public.settings
);
