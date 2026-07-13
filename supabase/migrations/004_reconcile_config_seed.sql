-- Halman Thompson — Reconcile Config Seed to Code
-- The seed data in 001_initial_schema.sql has drifted from the real source of
-- truth in code (src/lib/products/finishes.ts, src/lib/products/catalogue.ts).
-- The pricing engine (src/lib/pricing/engine.ts) reads the CODE, so these DB
-- config tables are currently only informational — but for production they must
-- match. This migration reconciles them with idempotent UPDATE statements
-- (safe to re-run; each simply re-asserts the code value). Migrations 001–003
-- are already applied and immutable, so corrections live here.

-- ═══════════════════════════════════════════════════════════
-- Finish config → match priceModifier in finishes.ts
-- (all 20 finishes re-asserted; 10 currently differ from the 001 seed)
-- ═══════════════════════════════════════════════════════════

UPDATE "hal-tho_finish_config" SET price_modifier = 1.4 WHERE finish_id = 'northumberland';
UPDATE "hal-tho_finish_config" SET price_modifier = 1.3 WHERE finish_id = 'hertfordshire';
UPDATE "hal-tho_finish_config" SET price_modifier = 1.6 WHERE finish_id = 'ayrshire';
UPDATE "hal-tho_finish_config" SET price_modifier = 1.4 WHERE finish_id = 'cheshire';
UPDATE "hal-tho_finish_config" SET price_modifier = 1.0 WHERE finish_id = 'natural-copper';
UPDATE "hal-tho_finish_config" SET price_modifier = 1.0 WHERE finish_id = 'brushed-copper';
UPDATE "hal-tho_finish_config" SET price_modifier = 1.0 WHERE finish_id = 'lightly-burnished-copper';
UPDATE "hal-tho_finish_config" SET price_modifier = 1.2 WHERE finish_id = 'antique-burnished-copper';
UPDATE "hal-tho_finish_config" SET price_modifier = 1.1 WHERE finish_id = 'antique-brushed-copper';
UPDATE "hal-tho_finish_config" SET price_modifier = 1.6 WHERE finish_id = 'somerset';            -- was 1.8
UPDATE "hal-tho_finish_config" SET price_modifier = 1.4 WHERE finish_id = 'wiltshire';           -- was 1.5
UPDATE "hal-tho_finish_config" SET price_modifier = 1.5 WHERE finish_id = 'berkshire';           -- was 1.3
UPDATE "hal-tho_finish_config" SET price_modifier = 1.3 WHERE finish_id = 'cambridgeshire';      -- was 1.0
UPDATE "hal-tho_finish_config" SET price_modifier = 1.0 WHERE finish_id = 'natural-brass';
UPDATE "hal-tho_finish_config" SET price_modifier = 1.5 WHERE finish_id = 'antique-brass';       -- was 1.2
UPDATE "hal-tho_finish_config" SET price_modifier = 1.5 WHERE finish_id = 'antique-brushed-brass'; -- was 1.1
UPDATE "hal-tho_finish_config" SET price_modifier = 1.3 WHERE finish_id = 'lightly-aged-zinc';   -- was 1.1
UPDATE "hal-tho_finish_config" SET price_modifier = 1.4 WHERE finish_id = 'antique-zinc';        -- was 1.3
UPDATE "hal-tho_finish_config" SET price_modifier = 1.8 WHERE finish_id = 'blackened-steel';     -- was 1.2
UPDATE "hal-tho_finish_config" SET price_modifier = 1.8 WHERE finish_id = 'corten-weathered';    -- was 1.0

-- ═══════════════════════════════════════════════════════════
-- Product config → match catalogue.ts
-- ═══════════════════════════════════════════════════════════

-- Reconcile product_type mismatch: catalogue uses "signage", the 001 seed used
-- "metal_signage". Idempotent — a no-op once the row has already been renamed.
UPDATE "hal-tho_product_config" SET product_type = 'signage' WHERE product_type = 'metal_signage';

-- splashback (already matched the seed; re-asserted for completeness)
UPDATE "hal-tho_product_config" SET
  min_width = 100, max_width = 4000, min_height = 100, max_height = 2000,
  default_width = 900, default_height = 600,
  labour_multiplier = 1.0, starting_price = 180, is_active = true
WHERE product_type = 'splashback';

-- worktop (max_width 3000→4000, max_height 1000→1200, labour 1.5→1.2)
UPDATE "hal-tho_product_config" SET
  min_width = 200, max_width = 4000, min_height = 200, max_height = 1200,
  default_width = 1200, default_height = 600,
  labour_multiplier = 1.2, starting_price = 350, is_active = true
WHERE product_type = 'worktop';

-- bar_top (min_height 200→300, max_height 1200→800, default_height 600→500)
UPDATE "hal-tho_product_config" SET
  min_width = 300, max_width = 4000, min_height = 300, max_height = 800,
  default_width = 1800, default_height = 500,
  labour_multiplier = 1.3, starting_price = 400, is_active = false
WHERE product_type = 'bar_top';

-- wall_panel (min_w/h 100→200, max_height 3000→2000, default_w 1000→1200,
--             default_h 1000→900, labour 0.9→1.1, price 150→250)
UPDATE "hal-tho_product_config" SET
  min_width = 200, max_width = 4000, min_height = 200, max_height = 2000,
  default_width = 1200, default_height = 900,
  labour_multiplier = 1.1, starting_price = 250, is_active = false
WHERE product_type = 'wall_panel';

-- table_top (min_w 300→200, max_w 2000→3000, min_h 300→200, max_h 1200→1500,
--            default_w 900→1200, default_h 600→800, labour 1.4→1.2)
UPDATE "hal-tho_product_config" SET
  min_width = 200, max_width = 3000, min_height = 200, max_height = 1500,
  default_width = 1200, default_height = 800,
  labour_multiplier = 1.2, starting_price = 300, is_active = false
WHERE product_type = 'table_top';

-- signage (renamed above; values already matched the catalogue, re-asserted)
UPDATE "hal-tho_product_config" SET
  min_width = 50, max_width = 2000, min_height = 50, max_height = 1000,
  default_width = 400, default_height = 200,
  labour_multiplier = 2.0, starting_price = 120, is_active = false
WHERE product_type = 'signage';
