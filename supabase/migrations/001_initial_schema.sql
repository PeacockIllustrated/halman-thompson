-- Halman Thompson — Initial Schema
-- All tables prefixed hal-tho_ (shared Supabase project)

-- ═══════════════════════════════════════════════════════════
-- Quotes
-- ═══════════════════════════════════════════════════════════

CREATE TABLE "hal-tho_quotes" (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL DEFAULT 'quote_requested',
  customer_name   text NOT NULL,
  customer_email  text NOT NULL,
  customer_phone  text,
  is_trade        boolean NOT NULL DEFAULT false,
  company_name    text,
  product_type    text NOT NULL,
  finish_id       text NOT NULL,
  finish_name     text NOT NULL,
  width           numeric NOT NULL,
  height          numeric NOT NULL,
  thickness       numeric NOT NULL,
  mounting_type   text NOT NULL DEFAULT 'none',
  lacquer_type    text NOT NULL DEFAULT 'matte',
  panel_count     integer NOT NULL DEFAULT 1,
  calculated_price numeric,
  price_breakdown  jsonb,
  configuration_url text,
  render_image_url text,
  notes           text,
  internal_notes  text,
  worktop_config  jsonb
);

ALTER TABLE "hal-tho_quotes" ENABLE ROW LEVEL SECURITY;

-- Public can insert quotes (submit from configurator)
CREATE POLICY "hal-tho_quotes_insert" ON "hal-tho_quotes"
  FOR INSERT TO anon WITH CHECK (true);

-- Only service role can read/update/delete
CREATE POLICY "hal-tho_quotes_admin_all" ON "hal-tho_quotes"
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ═══════════════════════════════════════════════════════════
-- Pricing Configuration (key-value)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE "hal-tho_pricing_config" (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key             text UNIQUE NOT NULL,
  value           jsonb NOT NULL,
  description     text,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "hal-tho_pricing_config" ENABLE ROW LEVEL SECURITY;

-- Public can read pricing config (needed for client-side price calc)
CREATE POLICY "hal-tho_pricing_read" ON "hal-tho_pricing_config"
  FOR SELECT TO anon USING (true);

CREATE POLICY "hal-tho_pricing_admin" ON "hal-tho_pricing_config"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed pricing data (matches engine.ts hardcoded values)
INSERT INTO "hal-tho_pricing_config" (key, value, description) VALUES
  ('base_price_per_m2', '{"copper": 180, "brass": 160, "zinc": 120, "steel": 90, "corten": 110}', 'Base material cost per square metre by metal type (£)'),
  ('thickness_surcharges', '{"0.7": -10, "0.9": 0, "1.2": 25, "1.5": 50, "2.0": 80}', 'Surcharge per m² relative to 0.9mm baseline (£)'),
  ('mounting_costs', '{"none": 0, "drilled_holes": 15, "adhesive": 5, "stake_frame": 45, "wire_hanging": 20, "screw_fixings": 15}', 'Flat-rate mounting preparation costs (£)'),
  ('multi_panel_surcharge', '50', 'Per additional panel beyond the first (£)'),
  ('delivery_base', '15', 'Base delivery cost (£)'),
  ('delivery_pallet_surcharge', '50', 'Additional cost for pallet delivery (£)'),
  ('pallet_threshold_mm', '1300', 'Max dimension (mm) before pallet delivery required'),
  ('vat_rate', '0.2', 'VAT rate (decimal)'),
  ('labour_base_pct', '0.15', 'Base labour percentage applied to material cost');


-- ═══════════════════════════════════════════════════════════
-- Product Configuration (per product type)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE "hal-tho_product_config" (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type      text UNIQUE NOT NULL,
  min_width         integer NOT NULL,
  max_width         integer NOT NULL,
  min_height        integer NOT NULL,
  max_height        integer NOT NULL,
  default_width     integer NOT NULL,
  default_height    integer NOT NULL,
  labour_multiplier numeric NOT NULL DEFAULT 1.0,
  starting_price    numeric NOT NULL DEFAULT 0,
  is_active         boolean NOT NULL DEFAULT true,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "hal-tho_product_config" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hal-tho_product_read" ON "hal-tho_product_config"
  FOR SELECT TO anon USING (true);

CREATE POLICY "hal-tho_product_admin" ON "hal-tho_product_config"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed product data (matches catalogue.ts)
INSERT INTO "hal-tho_product_config" (product_type, min_width, max_width, min_height, max_height, default_width, default_height, labour_multiplier, starting_price, is_active) VALUES
  ('splashback',    100, 4000, 100, 2000, 900,  600, 1.0, 180, true),
  ('worktop',       200, 3000, 200, 1000, 1200, 600, 1.5, 350, true),
  ('bar_top',       300, 4000, 200, 1200, 1800, 600, 1.3, 400, false),
  ('wall_panel',    100, 4000, 100, 3000, 1000, 1000, 0.9, 150, false),
  ('table_top',     300, 2000, 300, 1200, 900,  600, 1.4, 300, false),
  ('metal_signage', 50,  2000, 50,  1000, 400,  200, 2.0, 120, false);


-- ═══════════════════════════════════════════════════════════
-- Finish Configuration (per finish)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE "hal-tho_finish_config" (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finish_id       text UNIQUE NOT NULL,
  price_modifier  numeric NOT NULL DEFAULT 1.0,
  is_active       boolean NOT NULL DEFAULT true,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "hal-tho_finish_config" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hal-tho_finish_read" ON "hal-tho_finish_config"
  FOR SELECT TO anon USING (true);

CREATE POLICY "hal-tho_finish_admin" ON "hal-tho_finish_config"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed finish data (matches finishes.ts)
INSERT INTO "hal-tho_finish_config" (finish_id, price_modifier, is_active) VALUES
  ('northumberland',           1.4, true),
  ('hertfordshire',            1.3, true),
  ('ayrshire',                 1.6, true),
  ('cheshire',                 1.4, true),
  ('natural-copper',           1.0, true),
  ('brushed-copper',           1.0, true),
  ('lightly-burnished-copper', 1.0, true),
  ('antique-burnished-copper', 1.2, true),
  ('antique-brushed-copper',   1.1, true),
  ('somerset',                 1.8, true),
  ('wiltshire',                1.5, true),
  ('berkshire',                1.3, true),
  ('cambridgeshire',           1.0, true),
  ('natural-brass',            1.0, true),
  ('antique-brass',            1.2, true),
  ('antique-brushed-brass',    1.1, true),
  ('lightly-aged-zinc',        1.1, true),
  ('antique-zinc',             1.3, true),
  ('blackened-steel',          1.2, true),
  ('corten-weathered',         1.0, true);


-- ═══════════════════════════════════════════════════════════
-- Triggers: auto-update updated_at
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION "hal-tho_set_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "hal-tho_quotes_updated"
  BEFORE UPDATE ON "hal-tho_quotes"
  FOR EACH ROW EXECUTE FUNCTION "hal-tho_set_updated_at"();

CREATE TRIGGER "hal-tho_pricing_updated"
  BEFORE UPDATE ON "hal-tho_pricing_config"
  FOR EACH ROW EXECUTE FUNCTION "hal-tho_set_updated_at"();

CREATE TRIGGER "hal-tho_product_updated"
  BEFORE UPDATE ON "hal-tho_product_config"
  FOR EACH ROW EXECUTE FUNCTION "hal-tho_set_updated_at"();

CREATE TRIGGER "hal-tho_finish_updated"
  BEFORE UPDATE ON "hal-tho_finish_config"
  FOR EACH ROW EXECUTE FUNCTION "hal-tho_set_updated_at"();
