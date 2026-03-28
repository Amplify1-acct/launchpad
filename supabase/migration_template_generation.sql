-- Migration: Add template generation columns to websites table
-- Run this in Supabase SQL Editor: https://njfulajlqjhukfxmfexv.supabase.co/project/njfulajlqjhukfxmfexv/sql

-- 1. Add new status values to the enum
ALTER TYPE website_status ADD VALUE IF NOT EXISTS 'ready_for_review';
ALTER TYPE website_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE website_status ADD VALUE IF NOT EXISTS 'needs_revision';
ALTER TYPE website_status ADD VALUE IF NOT EXISTS 'needs_design';

-- 2. Add new columns to websites table
ALTER TABLE public.websites
  ADD COLUMN IF NOT EXISTS custom_html              text,
  ADD COLUMN IF NOT EXISTS template_name            text,
  ADD COLUMN IF NOT EXISTS generated_tokens         jsonb,
  ADD COLUMN IF NOT EXISTS generated_at             timestamptz,
  ADD COLUMN IF NOT EXISTS approved_at              timestamptz,
  ADD COLUMN IF NOT EXISTS revision_notes           text,
  ADD COLUMN IF NOT EXISTS revision_requested_at    timestamptz,
  ADD COLUMN IF NOT EXISTS stitch_project_id        text,
  ADD COLUMN IF NOT EXISTS vercel_url               text,
  ADD COLUMN IF NOT EXISTS deployed_at              timestamptz;
