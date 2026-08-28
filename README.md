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

Same flow as your CV project: connect repo, add env vars, deploy.

## License

MIT
