-- Migration: plan + Stitch image columns
-- Run at: https://supabase.com/dashboard/project/njfulajlqjhukfxmfexv/sql

-- Plan on customers table
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'starter'
  CHECK (plan IN ('starter', 'pro', 'premium'));

-- Plan + image tracking on websites table  
ALTER TABLE websites
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS image_source TEXT DEFAULT 'pexels',
  ADD COLUMN IF NOT EXISTS stitch_hero_url TEXT,
  ADD COLUMN IF NOT EXISTS stitch_card1_url TEXT,
  ADD COLUMN IF NOT EXISTS stitch_card2_url TEXT;

CREATE INDEX IF NOT EXISTS idx_websites_plan ON websites(plan);
CREATE INDEX IF NOT EXISTS idx_customers_plan ON customers(plan);

UPDATE websites SET plan = 'starter', image_source = 'pexels' WHERE plan IS NULL;
UPDATE customers SET plan = 'starter' WHERE plan IS NULL;

-- Verify
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name IN ('websites', 'customers') 
AND column_name IN ('plan', 'image_source', 'stitch_hero_url', 'stitch_card1_url', 'stitch_card2_url')
ORDER BY table_name, column_name;
