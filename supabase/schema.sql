-- Utilita / Trade-Now Supabase schema
-- Run this in the Supabase SQL editor

-- Custom types
CREATE TYPE user_role AS ENUM ('customer', 'tradesperson');
CREATE TYPE trade_type AS ENUM ('handyman', 'painter', 'mover', 'cleaner', 'plumber');
CREATE TYPE service_tier AS ENUM ('priority', 'within_12h', 'within_3d');
CREATE TYPE job_status AS ENUM ('requested', 'accepted', 'en_route', 'arrived', 'completed', 'declined', 'cancelled');

-- Users (synced from Clerk)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT,
  role user_role NOT NULL,
  trade_type trade_type,
  display_name TEXT,
  rating NUMERIC(2, 1),
  completed_jobs_count INTEGER DEFAULT 0,
  is_mock BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT tradesperson_needs_trade CHECK (
    role = 'customer' OR trade_type IS NOT NULL
  )
);

-- Tradesperson availability + mock location
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tradesperson_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_available BOOLEAN NOT NULL DEFAULT FALSE,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tradesperson_id)
);

-- Jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tradesperson_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  trade_type trade_type NOT NULL,
  description TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  status job_status NOT NULL DEFAULT 'requested',
  base_price NUMERIC(10, 2) NOT NULL DEFAULT 45.00,
  price NUMERIC(10, 2) NOT NULL,
  surge_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
  service_tier service_tier NOT NULL DEFAULT 'priority',
  scheduled_for TIMESTAMPTZ,
  tradesperson_lat DOUBLE PRECISION,
  tradesperson_lng DOUBLE PRECISION,
  rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_trade_type ON jobs(trade_type);
CREATE INDEX idx_jobs_customer ON jobs(customer_id);
CREATE INDEX idx_availability_available ON availability(is_available) WHERE is_available = TRUE;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER availability_updated_at
  BEFORE UPDATE ON availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Realtime for jobs and availability
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE availability;

-- Row Level Security (permissive for demo — tighten for production)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON availability FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON jobs FOR ALL USING (true) WITH CHECK (true);

-- Also allow anon for demo without RLS auth binding (uses service role on server)
CREATE POLICY "Allow anon read write demo" ON users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read write demo" ON availability FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read write demo" ON jobs FOR ALL TO anon USING (true) WITH CHECK (true);
