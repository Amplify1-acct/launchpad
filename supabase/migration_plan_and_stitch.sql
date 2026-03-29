-- Migration: Add plan and Stitch image columns to websites table
-- Run in Supabase SQL editor: https://supabase.com/dashboard/project/njfulajlqjhukfxmfexv/sql

-- Add plan column to customers if not already there
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'starter' 
  CHECK (plan IN ('starter', 'pro', 'premium'));

-- Add Stitch image and plan tracking to websites
ALTER TABLE websites
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS image_source TEXT DEFAULT 'pexels',
  ADD COLUMN IF NOT EXISTS stitch_hero_url TEXT,
  ADD COLUMN IF NOT EXISTS stitch_card1_url TEXT,
  ADD COLUMN IF NOT EXISTS stitch_card2_url TEXT;

-- Index for querying by plan
CREATE INDEX IF NOT EXISTS idx_websites_plan ON websites(plan);
CREATE INDEX IF NOT EXISTS idx_customers_plan ON customers(plan);

-- Update existing rows to starter plan
UPDATE websites SET plan = 'starter', image_source = 'pexels' WHERE plan IS NULL;
UPDATE customers SET plan = 'starter' WHERE plan IS NULL;
