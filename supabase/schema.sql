-- ============================================================
-- LaunchPad Database Schema
-- Run this in Supabase SQL Editor after creating the project
-- ============================================================

create extension if not exists "uuid-ossp";

-- CUSTOMERS
create table public.customers (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  email         text not null,
  full_name     text,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null,
  unique(user_id)
);

-- BUSINESSES
create table public.businesses (
  id              uuid primary key default uuid_generate_v4(),
  customer_id     uuid references public.customers(id) on delete cascade not null,
  name            text not null,
  description     text not null,
  industry        text,
  tagline         text,
  accent_color    text default '#0066ff',
  emoji           text default '🏆',
  phone           text,
  email           text,
  address         text,
  city            text,
  state           text,
  zip             text,
  website_url     text,
  domain          text,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null,
  unique(customer_id)
);

-- SUBSCRIPTIONS
create type subscription_status as enum ('trialing','active','past_due','canceled','unpaid','incomplete');
create type plan_name as enum ('starter','growth','premium');

create table public.subscriptions (
  id                     uuid primary key default uuid_generate_v4(),
  customer_id            uuid references public.customers(id) on delete cascade not null,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  plan                   plan_name not null default 'starter',
  status                 subscription_status not null default 'trialing',
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  trial_end              timestamptz,
  canceled_at            timestamptz,
  created_at             timestamptz default now() not null,
  updated_at             timestamptz default now() not null,
  unique(customer_id)
);

-- WEBSITES
create type website_status as enum ('pending','generating','live','error');

create table public.websites (
  id               uuid primary key default uuid_generate_v4(),
  business_id      uuid references public.businesses(id) on delete cascade not null,
  status           website_status default 'pending' not null,
  theme_id         text default 'modern',
  hero_image_url   text,
  services         jsonb,
  stats            jsonb,
  testimonials     jsonb,
  pages            jsonb,
  meta_title       text,
  meta_description text,
  schema_markup    jsonb,
  keywords         text[],
  vercel_url       text,
  deployed_at      timestamptz,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null,
  unique(business_id)
);

-- BLOG POSTS
create type post_status as enum ('queued','generating','draft','approved','published','error');

create table public.blog_posts (
  id            uuid primary key default uuid_generate_v4(),
  business_id   uuid references public.businesses(id) on delete cascade not null,
  title         text not null,
  slug          text,
  content       text,
  excerpt       text,
  keywords      text[],
  status        post_status default 'queued' not null,
  scheduled_for timestamptz,
  published_at  timestamptz,
  word_count    int,
  seo_score     int,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

-- SOCIAL POSTS
create type social_platform as enum ('facebook','instagram','linkedin');
create type social_status as enum ('queued','scheduled','posted','failed');

create table public.social_posts (
  id            uuid primary key default uuid_generate_v4(),
  business_id   uuid references public.businesses(id) on delete cascade not null,
  platform      social_platform not null,
  caption       text not null,
  image_url     text,
  status        social_status default 'queued' not null,
  scheduled_for timestamptz,
  posted_at     timestamptz,
  external_id   text,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

-- GENERATION JOBS
create type job_type as enum ('website','blog_post','social_posts','seo','photo');
create type job_status as enum ('pending','running','completed','failed');

create table public.generation_jobs (
  id            uuid primary key default uuid_generate_v4(),
  business_id   uuid references public.businesses(id) on delete cascade not null,
  type          job_type not null,
  status        job_status default 'pending' not null,
  result        jsonb,
  error         text,
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz default now() not null
);

-- ROW LEVEL SECURITY
alter table public.customers        enable row level security;
alter table public.businesses       enable row level security;
alter table public.subscriptions    enable row level security;
alter table public.websites         enable row level security;
alter table public.blog_posts       enable row level security;
alter table public.social_posts     enable row level security;
alter table public.generation_jobs  enable row level security;

create policy "customers_own"       on public.customers       for all using (auth.uid() = user_id);
create policy "businesses_own"      on public.businesses      for all using (customer_id in (select id from public.customers where user_id = auth.uid()));
create policy "subscriptions_own"   on public.subscriptions   for all using (customer_id in (select id from public.customers where user_id = auth.uid()));
create policy "websites_own"        on public.websites        for all using (business_id in (select b.id from public.businesses b join public.customers c on c.id = b.customer_id where c.user_id = auth.uid()));
create policy "blog_posts_own"      on public.blog_posts      for all using (business_id in (select b.id from public.businesses b join public.customers c on c.id = b.customer_id where c.user_id = auth.uid()));
create policy "social_posts_own"    on public.social_posts    for all using (business_id in (select b.id from public.businesses b join public.customers c on c.id = b.customer_id where c.user_id = auth.uid()));
create policy "generation_jobs_own" on public.generation_jobs for all using (business_id in (select b.id from public.businesses b join public.customers c on c.id = b.customer_id where c.user_id = auth.uid()));

-- AUTO-UPDATE updated_at
create or replace function public.handle_updated_at()
returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;

create trigger customers_updated_at      before update on public.customers      for each row execute function public.handle_updated_at();
create trigger businesses_updated_at     before update on public.businesses     for each row execute function public.handle_updated_at();
create trigger subscriptions_updated_at  before update on public.subscriptions  for each row execute function public.handle_updated_at();
create trigger websites_updated_at       before update on public.websites       for each row execute function public.handle_updated_at();
create trigger blog_posts_updated_at     before update on public.blog_posts     for each row execute function public.handle_updated_at();
create trigger social_posts_updated_at   before update on public.social_posts   for each row execute function public.handle_updated_at();

-- AUTO-CREATE CUSTOMER ROW ON SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.customers (user_id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
