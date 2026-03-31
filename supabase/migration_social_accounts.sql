-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/njfulajlqjhukfxmfexv/sql

CREATE TABLE IF NOT EXISTS public.social_accounts (
  id                uuid primary key default uuid_generate_v4(),
  business_id       uuid references public.businesses(id) on delete cascade not null,
  platform          text not null check (platform in ('facebook', 'instagram', 'tiktok')),
  account_id        text,
  account_name      text,
  account_picture   text,
  access_token      text,
  refresh_token     text,
  token_expires_at  timestamptz,
  page_id           text,
  page_name         text,
  page_access_token text,
  status            text default 'connected' not null,
  connected_at      timestamptz default now(),
  updated_at        timestamptz default now(),
  unique(business_id, platform)
);

ALTER TABLE public.social_accounts enable row level security;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'social_accounts' AND policyname = 'social_accounts_own'
  ) THEN
    CREATE POLICY "social_accounts_own" ON public.social_accounts
      FOR ALL USING (
        business_id IN (
          SELECT b.id FROM public.businesses b
          JOIN public.customers c ON c.id = b.customer_id
          WHERE c.user_id = auth.uid()
        )
      );
  END IF;
END $$;
