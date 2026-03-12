-- Run this in the Supabase SQL Editor to initialize the database.
-- Supabase project: songfor.me
--
-- ── Keys (Supabase new key system, 2025+) ─────────────────────────────────
-- NEXT_PUBLIC_SUPABASE_URL     → Project URL (dashboard home page)
-- NEXT_PUBLIC_SUPABASE_ANON_KEY → Publishable key (sb_publishable_...) on dashboard home page
-- SUPABASE_SERVICE_ROLE_KEY    → Secret key (sb_secret_...) in Settings → API Keys → Secret keys tab
-- Legacy anon/service_role JWT keys still work during transition.
--
-- ── Storage bucket (manual step — cannot be done via SQL) ─────────────────
-- ✅ DONE (2026-03-12) — bucket created, public, policies applied
-- 1. Dashboard → Storage → New bucket
-- 2. Name: songs
-- 3. Set to PUBLIC (so audio files are directly streamable without auth)
-- 4. Click Create Bucket
-- The storage policy below grants public read access to all objects in the bucket.

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

-- ─────────────────────────────────────────
-- STORAGE POLICIES
-- (Run after creating the "songs" bucket in the Storage dashboard)
-- ─────────────────────────────────────────

-- Allow anyone to download/stream public song files
create policy "Public songs are downloadable"
  on storage.objects for select
  using ( bucket_id = 'songs' );

-- Only service role can upload (enforced at the API layer — admin route uses service key)
create policy "Service role can upload songs"
  on storage.objects for insert
  with check ( bucket_id = 'songs' );
