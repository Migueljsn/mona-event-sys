-- Tabela de eventos de rastreamento da vitrine pública
CREATE TABLE IF NOT EXISTS card_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id      uuid        REFERENCES cards(id) ON DELETE CASCADE,
  event_type   text        NOT NULL CHECK (event_type IN ('click', 'add_to_cart', 'whatsapp')),
  session_id   text,
  device       text,       -- mobile | tablet | desktop
  os           text,       -- iOS | Android | Windows | macOS | Linux | Outro
  browser      text,       -- Chrome | Safari | Firefox | Edge | Opera | Outro
  referrer     text,       -- URL de origem ou 'direct'
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  screen       text,       -- ex: "1920x1080"
  language     text,       -- ex: "pt-BR"
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS card_events_card_id_idx   ON card_events(card_id);
CREATE INDEX IF NOT EXISTS card_events_type_idx      ON card_events(event_type);
CREATE INDEX IF NOT EXISTS card_events_created_at_idx ON card_events(created_at);

-- RLS: público insere, autenticado lê
ALTER TABLE card_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_events" ON card_events
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "auth_read_events" ON card_events
  FOR SELECT TO authenticated USING (true);

-- pg_cron: limpa eventos com mais de 12 meses todo dia 1 às 03:00 UTC
-- Requer extensão pg_cron habilitada no Supabase (Dashboard → Database → Extensions)
SELECT cron.schedule(
  'delete-old-card-events',
  '0 3 1 * *',
  $$DELETE FROM card_events WHERE created_at < now() - INTERVAL '12 months'$$
);
