-- Run this in the Supabase SQL Editor to initialize the database.
-- Supabase project: songfor.me

-- ─────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────
create table if not exists orders (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  buyer_email       text not null,
  recipient_name    text not null,
  intake_data       jsonb not null,
  lyrics            text,
  suno_style        text,
  status            text not null default 'pending_payment',
  stripe_session_id text,
  song_id           uuid
);

alter table orders enable row level security;

-- No public access — all writes/reads go through the service role key
create policy "Service role only" on orders
  using (false);

-- ─────────────────────────────────────────
-- SONGS
-- ─────────────────────────────────────────
create table if not exists songs (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  order_id       uuid references orders(id),
  recipient_name text not null,
  lyrics         text not null,
  suno_style     text not null,
  audio_url      text,
  is_public      boolean not null default true
);

alter table songs enable row level security;

-- Public songs are readable by anyone (for the shareable song page)
create policy "Public songs are readable" on songs
  for select using (is_public = true);

-- ─────────────────────────────────────────
-- EMAILS (waitlist / email capture)
-- ─────────────────────────────────────────
create table if not exists emails (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email      text unique not null,
  source     text not null default 'landing'
);

alter table emails enable row level security;

create policy "Service role only" on emails
  using (false);
