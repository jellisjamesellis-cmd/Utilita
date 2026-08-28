# Utilita

On-demand trades marketplace **demo** — live dispatch mechanic with request, accept/decline, simulated GPS movement, and surge pricing.

Built with **Next.js 14**, **Clerk** (customer + tradesperson roles), **Supabase** (Postgres + Realtime), and **Leaflet / OpenStreetMap**.

## What this is (and isn't)

This proves the **live dispatch mechanic** for unregulated trades only: handyman, painter, mover, cleaner. It does **not** include vetting, insurance, payments, or real GPS tracking.

## Setup

### 1. Clone & install

```bash
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL editor
3. Enable Realtime on `jobs` and `availability` (included in schema)

### 3. Clerk

1. Create an application at [clerk.com](https://clerk.com)
2. Copy publishable + secret keys to `.env.local`

### 4. Environment

Copy `.env.example` → `.env.local` and fill in values.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Flows

| Role | Path | Description |
|------|------|-------------|
| Both | `/` | Sign up, pick customer or tradesperson |
| Customer | `/request` | Pick trade, drop pin, see surge + price estimate, submit |
| Customer | `/job/[id]` | Live map, status updates, simulated tradesperson movement, rating |
| Tradesperson | `/dashboard` | Availability toggle, incoming jobs, 30s accept countdown |

## Project structure

```
app/
  page.tsx              — role selection
  request/page.tsx      — customer job request
  job/[id]/page.tsx     — live tracking
  dashboard/page.tsx    — tradesperson dashboard
lib/
  supabaseClient.ts
  pricing.ts            — surge multiplier
  simulateMovement.ts   — mock GPS over ~2 min
components/
  MapView.tsx
  JobCard.tsx
supabase/
  schema.sql
```

## Deploy (Vercel)

This app is intended to run on **Vercel** with secrets in **Project Settings → Environment Variables** (not a local `.env.local`).

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run `supabase/schema.sql`
3. Under **Project Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only — never expose to the browser)

### 2. Clerk

1. Create a Next.js application at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Copy **API Keys** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
3. Under **Paths**, set sign-in URL `/sign-in` and sign-up URL `/sign-up` (or use the env vars below)
4. After deploy, add your Vercel URL(s) under **Allowed redirect URLs** and **Allowed origins**

### 3. Import in Vercel

1. Push this repo to GitHub and **Import** it in [vercel.com/new](https://vercel.com/new)
2. Framework preset: **Next.js** (auto-detected)
3. Add these variables for **Production** and **Preview**:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk browser key |
| `CLERK_SECRET_KEY` | Clerk server key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (API routes) |

4. Deploy. Vercel will build with `npm run build` on each push.

### 4. Post-deploy

- In Clerk, add `https://<your-vercel-domain>` to allowed redirects/origins
- Smoke-test: sign up as tradesperson + customer in two windows, submit a job, accept, watch simulated map movement

### CLI (optional)

If you use the Vercel CLI with `VERCEL_TOKEN` set:

```bash
npx vercel link
npx vercel env pull .env.local   # local dev only
npx vercel --prod
```

## License

MIT
