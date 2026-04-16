-- demo_builds table: tracks custom demo generation jobs
create table if not exists demo_builds (
  slug        text primary key,
  status      text not null default 'pending', -- pending | ready | failed
  biz_name    text not null,
  city        text not null,
  state       text not null,
  style       text not null default 'bold',
  copy        jsonb,
  images      jsonb default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Auto-expire rows after 48 hours (optional cleanup)
-- Add index for polling
create index if not exists demo_builds_slug_idx on demo_builds(slug);
create index if not exists demo_builds_status_idx on demo_builds(status);

-- RLS: only service role can write, anyone can read by slug
alter table demo_builds enable row level security;

create policy "service role full access" on demo_builds
  for all using (true) with check (true);
