# АКТИВ — Personal Asset OS

> Поймите, во сколько вам на самом деле обходятся ваши вещи.

Интерфейс полностью на русском языке; валюта по умолчанию — рубли (RUB), рынок — Россия. Валюта и регион меняются в настройках профиля; каталог хранит цены в EUR и конвертирует через `FxProvider` (`src/lib/currency.ts`).

A financial portfolio for physical things: track what you paid, what each item is worth today, how fast it depreciates, what owning it costs per day, and whether it's a good time to sell.

Stack: **Next.js 16 (App Router) · TypeScript · Tailwind v4 · Motion · Recharts · Zod · Supabase (Auth / Postgres / Storage) · Anthropic Claude (vision)**. Installable PWA.

## Quick start (zero-config demo)

```bash
npm install
npm run dev
```

Open http://localhost:3000. By default the app talks to the production Supabase project (public URL + publishable key live in `src/lib/supabase-config.ts`; env vars override them). Set `ACTIV_DATA_MODE=local` to run the offline **local demo mode**: a file-backed store in `.data/` and a cookie session — any email/password signs you in. Use **Settings → Load demo portfolio** (or the empty-state button) to get a realistic portfolio.

## Production setup

1. Create a Supabase project and run `supabase/migrations/0001_init.sql` (SQL editor or `supabase db push`). It creates all tables, RLS policies, the profile trigger and the private `asset-files` bucket.
2. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only, used by the daily cron)
   - `ANTHROPIC_API_KEY` for real AI identification (otherwise a deterministic demo identifier is used)
   - `CRON_SECRET` for `/api/cron/revalue` (schedule in `vercel.json`)
3. Enable Google (and optionally Apple, `NEXT_PUBLIC_AUTH_APPLE=1`) in Supabase Auth, redirect URL `https://<host>/auth/callback`.
4. Deploy to Vercel. Local demo mode is refused on Vercel automatically.

## Architecture

```
src/
  app/            routes (landing, auth, onboarding, /app/*, API routes, manifest)
  components/     UI primitives, shell, feature components
  features/       use-cases + server actions (assets, portfolio, insights, notifications, profile, demo)
  services/       infrastructure: data store (Supabase | local), auth session, storage, identification
  valuation/      valuation engine, providers (internal, eBay, marketplace, manual, mock), catalog, curves
  lib/            currency/FX, finance math, dates, formatting, analytics, env
  types/          domain model + categories
supabase/         SQL migrations (schema + RLS)
public/sw.js      service worker (offline shell)
```

**Valuation** (`src/valuation`): `ValuationEngine` blends any number of `ValuationProvider`s. `InternalPricingProvider` is deterministic: launch price × category depreciation curve × brand retention × successor pressure × condition × region × seasonality. Every valuation appends to `asset_value_history`; portfolio snapshots are stored daily. Providers for eBay / partner marketplaces are wired as integration boundaries and enable themselves when their env vars are present.

**Cost of ownership**: `purchase + expenses − current value`, `/ days owned` for the daily figure (`src/lib/finance.ts`).

**Security**: every table has RLS (`auth.uid() = user_id`); all store calls are user-scoped; files are served through `/api/files/<userId>/…` with an ownership check; secrets (Anthropic, service role) are server-only.

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # eslint
npm test           # vitest (valuation engine, finance math)
```
