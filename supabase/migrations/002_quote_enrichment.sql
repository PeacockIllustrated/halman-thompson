-- Halman Thompson — Quote Enrichment
-- Adds SVG/DXF exports, full config snapshot, flat sheet data, and device info to quotes

-- ═══════════════════════════════════════════════════════════
-- New columns on hal-tho_quotes
-- ═══════════════════════════════════════════════════════════

ALTER TABLE "hal-tho_quotes"
  ADD COLUMN IF NOT EXISTS svg_workshop        text,
  ADD COLUMN IF NOT EXISTS svg_production      text,
  ADD COLUMN IF NOT EXISTS dxf_export          text,
  ADD COLUMN IF NOT EXISTS configuration_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS flat_sheet          jsonb,
  ADD COLUMN IF NOT EXISTS panel_layout        jsonb,
  ADD COLUMN IF NOT EXISTS device_info         jsonb,
  ADD COLUMN IF NOT EXISTS base_metal          text,
  ADD COLUMN IF NOT EXISTS lacquer_type_actual text DEFAULT 'matte',
  ADD COLUMN IF NOT EXISTS signage_config      jsonb;

-- ═══════════════════════════════════════════════════════════
-- Status history tracking — append-only log of status changes
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "hal-tho_quote_events" (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id    uuid NOT NULL REFERENCES "hal-tho_quotes"(id) ON DELETE CASCADE,
  event_type  text NOT NULL,                -- e.g. 'status_change', 'note_added', 'svg_downloaded'
  old_value   text,
  new_value   text,
  actor       text DEFAULT 'admin',         -- who made the change
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "hal-tho_quote_events" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hal-tho_events_admin" ON "hal-tho_quote_events"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Index for fast lookups by quote
CREATE INDEX IF NOT EXISTS idx_quote_events_quote_id ON "hal-tho_quote_events"(quote_id);
