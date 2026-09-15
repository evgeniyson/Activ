-- АКТИВ · Personal Asset OS — initial schema
-- Run with `supabase db push` or paste into the SQL editor.
-- Every table is protected by Row Level Security: users can only touch rows
-- whose user_id matches auth.uid().

create extension if not exists "pgcrypto";

-- ── Profiles ──────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  country text,
  preferred_currency text not null default 'RUB',
  market_region text not null default 'RU',
  onboarding_completed boolean not null default false,
  notification_prefs jsonb not null default '{"priceChanges":true,"sellOpportunities":true,"warrantyAlerts":true,"monthlyReport":true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Assets ────────────────────────────────────────────────────────────
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null default 'other',
  manufacturer text,
  model text,
  variant text,
  description text,
  specs jsonb not null default '{}'::jsonb,
  catalog_id text,
  purchase_price numeric(14,2) not null default 0,
  purchase_currency text not null default 'RUB',
  purchase_date date not null,
  retailer text,
  condition text not null default 'excellent',
  current_estimated_value numeric(14,2),
  current_low_estimate numeric(14,2),
  current_high_estimate numeric(14,2),
  quick_sale_value numeric(14,2),
  valuation_confidence numeric(4,3),
  valuation_currency text not null default 'RUB',
  valuation_date date,
  identification_confidence numeric(4,3),
  serial_number text,
  imei text,
  warranty_expiration date,
  notes text,
  status text not null default 'active',
  sold_price numeric(14,2),
  sold_date date,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assets_status_check check (status in ('active','sold','lost','archived')),
  constraint assets_condition_check check (condition in ('like_new','excellent','good','fair','poor'))
);
create index if not exists assets_user_idx on public.assets (user_id, status);
create index if not exists assets_user_created_idx on public.assets (user_id, created_at desc);

-- ── Asset images ──────────────────────────────────────────────────────
create table if not exists public.asset_images (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  url text not null,
  storage_path text,
  width int,
  height int,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists asset_images_asset_idx on public.asset_images (asset_id);

-- ── Asset specs (normalised key/value; `assets.specs` jsonb is the fast path) ─
create table if not exists public.asset_specs (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  value text not null,
  unique (asset_id, key)
);

-- ── Expenses ──────────────────────────────────────────────────────────
create table if not exists public.asset_expenses (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null default 'other',
  amount numeric(14,2) not null,
  currency text not null default 'RUB',
  date date not null,
  title text not null,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists asset_expenses_asset_idx on public.asset_expenses (asset_id);
create index if not exists asset_expenses_user_idx on public.asset_expenses (user_id);

-- ── Documents ─────────────────────────────────────────────────────────
create table if not exists public.asset_documents (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null default 'other',
  title text not null,
  url text not null,
  storage_path text,
  created_at timestamptz not null default now()
);
create index if not exists asset_documents_asset_idx on public.asset_documents (asset_id);

-- ── Value history (append-only) ───────────────────────────────────────
create table if not exists public.asset_value_history (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  estimated_value numeric(14,2) not null,
  low_estimate numeric(14,2) not null,
  high_estimate numeric(14,2) not null,
  quick_sale_estimate numeric(14,2),
  currency text not null default 'RUB',
  source text not null default 'internal',
  confidence numeric(4,3) not null default 0,
  comparables_count int,
  created_at timestamptz not null default now()
);
create index if not exists asset_value_history_asset_date_idx on public.asset_value_history (asset_id, date);
create index if not exists asset_value_history_user_idx on public.asset_value_history (user_id, date);

-- ── Events / timeline ─────────────────────────────────────────────────
create table if not exists public.asset_events (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  date date not null,
  title text not null,
  description text,
  amount numeric(14,2),
  currency text,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists asset_events_asset_idx on public.asset_events (asset_id, date);
create index if not exists asset_events_user_idx on public.asset_events (user_id, created_at desc);

-- ── Portfolio snapshots ───────────────────────────────────────────────
create table if not exists public.portfolio_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  total_value numeric(14,2) not null,
  purchase_value numeric(14,2) not null,
  total_depreciation numeric(14,2) not null,
  currency text not null default 'RUB',
  asset_count int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ── Notifications ─────────────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  asset_id uuid references public.assets (id) on delete cascade,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- ── Valuation sources (registry; global, read-only for users) ─────────
create table if not exists public.valuation_sources (
  id text primary key,
  name text not null,
  description text,
  enabled boolean not null default true,
  weight numeric(4,2) not null default 1
);
insert into public.valuation_sources (id, name, description, enabled, weight) values
  ('internal', 'Внутренняя модель', 'Детерминированная модель: цена на старте продаж, возраст продукта, состояние, регион и сезонность.', true, 1),
  ('ebay', 'Объявления eBay', 'Медиана активных объявлений eBay в вашем регионе.', false, 1.4),
  ('marketplace', 'Данные маркетплейсов', 'Партнёрский ценовой фид (Авито и др.).', false, 1.2),
  ('manual', 'Ручная оценка', 'Значения, которые вы указали сами.', true, 3),
  ('mock', 'Тестовый провайдер', 'Детерминированная заглушка для тестов.', false, 0.5)
on conflict (id) do nothing;

-- ── updated_at trigger ────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists assets_set_updated_at on public.assets;
create trigger assets_set_updated_at before update on public.assets for each row execute procedure public.set_updated_at();
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.assets enable row level security;
alter table public.asset_images enable row level security;
alter table public.asset_specs enable row level security;
alter table public.asset_expenses enable row level security;
alter table public.asset_documents enable row level security;
alter table public.asset_value_history enable row level security;
alter table public.asset_events enable row level security;
alter table public.portfolio_snapshots enable row level security;
alter table public.notifications enable row level security;
alter table public.valuation_sources enable row level security;

drop policy if exists "profiles: own" on public.profiles;
create policy "profiles: own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "assets: own" on public.assets;
create policy "assets: own" on public.assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "asset_images: own" on public.asset_images;
create policy "asset_images: own" on public.asset_images
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "asset_specs: own" on public.asset_specs;
create policy "asset_specs: own" on public.asset_specs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "asset_expenses: own" on public.asset_expenses;
create policy "asset_expenses: own" on public.asset_expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "asset_documents: own" on public.asset_documents;
create policy "asset_documents: own" on public.asset_documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "asset_value_history: own" on public.asset_value_history;
create policy "asset_value_history: own" on public.asset_value_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "asset_events: own" on public.asset_events;
create policy "asset_events: own" on public.asset_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "portfolio_snapshots: own" on public.portfolio_snapshots;
create policy "portfolio_snapshots: own" on public.portfolio_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notifications: own" on public.notifications;
create policy "notifications: own" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "valuation_sources: read" on public.valuation_sources;
create policy "valuation_sources: read" on public.valuation_sources
  for select using (auth.role() = 'authenticated');

-- ── Storage: private bucket, per-user folders ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('asset-files', 'asset-files', false, 15728640, array['image/jpeg','image/png','image/webp','image/heic','application/pdf'])
on conflict (id) do nothing;

drop policy if exists "asset-files: own folder read" on storage.objects;
create policy "asset-files: own folder read" on storage.objects
  for select using (bucket_id = 'asset-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "asset-files: own folder write" on storage.objects;
create policy "asset-files: own folder write" on storage.objects
  for insert with check (bucket_id = 'asset-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "asset-files: own folder delete" on storage.objects;
create policy "asset-files: own folder delete" on storage.objects
  for delete using (bucket_id = 'asset-files' and (storage.foldername(name))[1] = auth.uid()::text);
