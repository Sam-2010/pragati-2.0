-- PRAGATI Audit Trail Table
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID NOT NULL,
  action_taken TEXT NOT NULL,
  performed_by TEXT NOT NULL DEFAULT 'Clerk_Deshmukh',
  ip_address TEXT DEFAULT 'demo_session',
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by application
CREATE INDEX IF NOT EXISTS idx_audit_app_id ON audit_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- RLS bypassed for hackathon demo (service role key handles access)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access on audit_logs"
  ON audit_logs FOR ALL
  USING (true)
  WITH CHECK (true);
