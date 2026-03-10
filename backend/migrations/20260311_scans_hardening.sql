-- Vaurex: scans table hardening migration (idempotent)
-- Run in Supabase SQL Editor.

BEGIN;

CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    risk_score INTEGER,
    risk_label TEXT,
    summary TEXT,
    entities JSONB NOT NULL DEFAULT '[]'::jsonb,
    flags JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_text TEXT,
    clean_text TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS risk_score INTEGER;
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS risk_label TEXT;
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS entities JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS flags JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS raw_text TEXT;
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS clean_text TEXT;
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'scans_status_check'
      AND conrelid = 'public.scans'::regclass
  ) THEN
    ALTER TABLE public.scans DROP CONSTRAINT scans_status_check;
  END IF;
END $$;

-- Normalize status values after dropping any old incompatible constraint.
UPDATE public.scans
SET status = CASE
  WHEN lower(coalesce(status, '')) IN ('done') THEN 'done'
  WHEN lower(coalesce(status, '')) IN ('failed', 'failure', 'error') THEN 'error'
  WHEN lower(coalesce(status, '')) IN ('processing', 'queued', 'pending', 'running') THEN 'processing'
  WHEN lower(coalesce(status, '')) IN ('complete', 'completed', 'success') THEN 'done'
  ELSE 'processing'
END;

ALTER TABLE public.scans
  ADD CONSTRAINT scans_status_check
  CHECK (status IN ('processing', 'done', 'error'));

CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'scans'
      AND policyname = 'Users can view own scans'
  ) THEN
    CREATE POLICY "Users can view own scans" ON public.scans
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'scans'
      AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access" ON public.scans
      FOR ALL USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_scans_set_updated_at'
      AND tgrelid = 'public.scans'::regclass
  ) THEN
    CREATE TRIGGER trg_scans_set_updated_at
      BEFORE UPDATE ON public.scans
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

COMMIT;
