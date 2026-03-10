-- Vaurex canonical Supabase schema for scans table
-- Run in Supabase SQL editor for a fresh setup.

CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'done', 'error')),
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

CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);

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
