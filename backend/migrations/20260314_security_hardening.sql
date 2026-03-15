-- Vaurex: security hardening migration (idempotent)
-- Adds persistent guest rate-limit table, hardens RLS on all tables,
-- and adds missing ownership constraints.
-- Run in Supabase SQL Editor after 20260313_new_features.sql.

BEGIN;

-- ============================================================
-- 1. Guest rate-limit events table
--    Used by PersistentGuestRateLimiter in services/rate_limiter.py
--    Schema MUST match the columns queried in _allow_blocking:
--      limiter_key, window_start, hits, reset_at
-- ============================================================

-- Drop the old incorrect table if it exists with wrong schema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'rate_limit_events'
      AND column_name  = 'fingerprint'
  ) THEN
    DROP TABLE IF EXISTS public.rate_limit_events CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.rate_limit_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    limiter_key  TEXT NOT NULL,       -- composite key: "guest:METHOD:PATH:fingerprint"
    window_start INTEGER NOT NULL,    -- unix epoch rounded to window boundary
    hits         INTEGER NOT NULL DEFAULT 1,
    reset_at     INTEGER NOT NULL,    -- unix epoch of window expiry
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rle_key_window
    ON public.rate_limit_events (limiter_key, window_start);

CREATE INDEX IF NOT EXISTS idx_rle_reset_at
    ON public.rate_limit_events (reset_at);

-- Automatically purge expired windows to bound table size.
CREATE OR REPLACE FUNCTION public.purge_stale_rate_limit_events()
RETURNS void LANGUAGE sql AS $$
    DELETE FROM public.rate_limit_events
    WHERE reset_at < EXTRACT(EPOCH FROM now())::INTEGER;
$$;

-- RLS: only the service role writes/reads this table.
-- Authenticated users and anon have no direct access.
ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'rate_limit_events'
      AND policyname = 'Service role full access on rate_limit_events'
  ) THEN
    CREATE POLICY "Service role full access on rate_limit_events"
      ON public.rate_limit_events
      FOR ALL
      USING     (auth.role() = 'service_role')
      WITH CHECK(auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================
-- 2. scans – ensure WRITE policies exist (idempotent)
--    Service role inserts/updates rows on behalf of the job worker.
--    Authenticated users may delete their own scans.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'scans'
      AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access"
      ON public.scans
      FOR ALL
      USING     (auth.role() = 'service_role')
      WITH CHECK(auth.role() = 'service_role');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'scans'
      AND policyname = 'Users can delete own scans'
  ) THEN
    CREATE POLICY "Users can delete own scans"
      ON public.scans
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- 3. kb_collections – tighten policies to per-operation
-- ============================================================

-- Drop the broad ALL policy added by 20260313 so we can replace with
-- explicit per-command policies that are easier to audit.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'kb_collections'
      AND policyname = 'users own kb_collections'
  ) THEN
    DROP POLICY "users own kb_collections" ON public.kb_collections;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'kb_collections'
      AND policyname = 'kb_collections: owner select'
  ) THEN
    CREATE POLICY "kb_collections: owner select"
      ON public.kb_collections FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'kb_collections'
      AND policyname = 'kb_collections: owner insert'
  ) THEN
    CREATE POLICY "kb_collections: owner insert"
      ON public.kb_collections FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'kb_collections'
      AND policyname = 'kb_collections: owner update'
  ) THEN
    CREATE POLICY "kb_collections: owner update"
      ON public.kb_collections FOR UPDATE
      USING     (auth.uid() = user_id)
      WITH CHECK(auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'kb_collections'
      AND policyname = 'kb_collections: owner delete'
  ) THEN
    CREATE POLICY "kb_collections: owner delete"
      ON public.kb_collections FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'kb_collections'
      AND policyname = 'kb_collections: service role full access'
  ) THEN
    CREATE POLICY "kb_collections: service role full access"
      ON public.kb_collections FOR ALL
      USING     (auth.role() = 'service_role')
      WITH CHECK(auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================
-- 4. kb_documents – tighten policies
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'kb_documents'
      AND policyname = 'users own kb_documents'
  ) THEN
    DROP POLICY "users own kb_documents" ON public.kb_documents;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'kb_documents'
      AND policyname = 'kb_documents: owner select'
  ) THEN
    CREATE POLICY "kb_documents: owner select"
      ON public.kb_documents FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'kb_documents'
      AND policyname = 'kb_documents: owner insert'
  ) THEN
    CREATE POLICY "kb_documents: owner insert"
      ON public.kb_documents FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'kb_documents'
      AND policyname = 'kb_documents: owner delete'
  ) THEN
    CREATE POLICY "kb_documents: owner delete"
      ON public.kb_documents FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'kb_documents'
      AND policyname = 'kb_documents: service role full access'
  ) THEN
    CREATE POLICY "kb_documents: service role full access"
      ON public.kb_documents FOR ALL
      USING     (auth.role() = 'service_role')
      WITH CHECK(auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================
-- 5. kb_chunks – tighten policies
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'kb_chunks'
      AND policyname = 'users own kb_chunks'
  ) THEN
    DROP POLICY "users own kb_chunks" ON public.kb_chunks;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'kb_chunks'
      AND policyname = 'kb_chunks: owner select via collection'
  ) THEN
    CREATE POLICY "kb_chunks: owner select via collection"
      ON public.kb_chunks FOR SELECT
      USING (
        collection_id IN (
          SELECT id FROM public.kb_collections WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'kb_chunks'
      AND policyname = 'kb_chunks: service role full access'
  ) THEN
    CREATE POLICY "kb_chunks: service role full access"
      ON public.kb_chunks FOR ALL
      USING     (auth.role() = 'service_role')
      WITH CHECK(auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================
-- 6. compliance_reports – tighten policies
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'compliance_reports'
      AND policyname = 'users own compliance_reports'
  ) THEN
    DROP POLICY "users own compliance_reports" ON public.compliance_reports;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'compliance_reports'
      AND policyname = 'compliance_reports: owner select'
  ) THEN
    CREATE POLICY "compliance_reports: owner select"
      ON public.compliance_reports FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'compliance_reports'
      AND policyname = 'compliance_reports: owner delete'
  ) THEN
    CREATE POLICY "compliance_reports: owner delete"
      ON public.compliance_reports FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'compliance_reports'
      AND policyname = 'compliance_reports: service role full access'
  ) THEN
    CREATE POLICY "compliance_reports: service role full access"
      ON public.compliance_reports FOR ALL
      USING     (auth.role() = 'service_role')
      WITH CHECK(auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================
-- 7. support_logs – tighten policies
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'support_logs'
      AND policyname = 'users own support_logs'
  ) THEN
    DROP POLICY "users own support_logs" ON public.support_logs;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'support_logs'
      AND policyname = 'users can insert support_logs'
  ) THEN
    DROP POLICY "users can insert support_logs" ON public.support_logs;
  END IF;
END $$;

-- Authenticated users see only their own logged support requests.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'support_logs'
      AND policyname = 'support_logs: owner select'
  ) THEN
    CREATE POLICY "support_logs: owner select"
      ON public.support_logs FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Guests (anon) and authenticated users can submit new support logs.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'support_logs'
      AND policyname = 'support_logs: anyone can insert'
  ) THEN
    CREATE POLICY "support_logs: anyone can insert"
      ON public.support_logs FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Service role has full access for support-staff tooling.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'support_logs'
      AND policyname = 'support_logs: service role full access'
  ) THEN
    CREATE POLICY "support_logs: service role full access"
      ON public.support_logs FOR ALL
      USING     (auth.role() = 'service_role')
      WITH CHECK(auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================
-- 8. Add storage_path column to scans for UUID-based filenames
--    (populated by upload route; display name already in filename)
-- ============================================================

ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- ============================================================
-- 9. Add storage_path column to kb_documents
-- ============================================================

ALTER TABLE public.kb_documents
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

COMMIT;
