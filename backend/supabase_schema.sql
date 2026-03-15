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

-- STORAGE: Avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = excluded.public;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Avatar images are publicly accessible.'
  ) THEN
    CREATE POLICY "Avatar images are publicly accessible." 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload their own avatar.'
  ) THEN
    CREATE POLICY "Users can upload their own avatar." 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their own avatar.'
  ) THEN
    CREATE POLICY "Users can update their own avatar." 
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
  END IF;
END $$;
