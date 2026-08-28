-- Add 'arrived' job status for mock auto-match flow
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'arrived';
