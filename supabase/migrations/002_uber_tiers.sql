-- Migration: plumber trade, service tiers, mock seed fields
-- Run in Supabase SQL editor if upgrading an existing project

ALTER TYPE trade_type ADD VALUE IF NOT EXISTS 'plumber';

DO $$ BEGIN
  CREATE TYPE service_tier AS ENUM ('priority', 'within_12h', 'within_3d');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(2, 1),
  ADD COLUMN IF NOT EXISTS completed_jobs_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_mock BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS service_tier service_tier NOT NULL DEFAULT 'priority',
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_is_mock ON users(is_mock) WHERE is_mock = TRUE;
CREATE INDEX IF NOT EXISTS idx_jobs_service_tier ON jobs(service_tier);
