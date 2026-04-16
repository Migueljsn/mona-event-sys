-- Adiciona campos de rastreamento à tabela settings
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS gtm_id        text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS meta_pixel_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS google_ads_id text DEFAULT NULL;
