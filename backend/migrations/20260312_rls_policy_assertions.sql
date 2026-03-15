-- Vaurex: explicit RLS policy tests + ownership assertions
-- Run in Supabase SQL editor after schema/migrations are applied.

BEGIN;

DO $$
DECLARE
  rls_enabled bool;
  select_policy_count int;
  service_policy_count int;
  users_view_qual text;
BEGIN
  SELECT c.relrowsecurity
  INTO rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'scans';

  IF rls_enabled IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'RLS is not enabled on public.scans';
  END IF;

  SELECT count(*)
  INTO select_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'scans'
    AND policyname = 'Users can view own scans';

  IF select_policy_count <> 1 THEN
    RAISE EXCEPTION 'Expected policy "Users can view own scans" to exist exactly once';
  END IF;

  SELECT count(*)
  INTO service_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'scans'
    AND policyname = 'Service role full access';

  IF service_policy_count <> 1 THEN
    RAISE EXCEPTION 'Expected policy "Service role full access" to exist exactly once';
  END IF;

  SELECT qual
  INTO users_view_qual
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'scans'
    AND policyname = 'Users can view own scans'
  LIMIT 1;

  IF users_view_qual IS NULL OR users_view_qual NOT LIKE '%auth.uid()%user_id%' THEN
    RAISE EXCEPTION 'Ownership assertion failed: expected auth.uid() = user_id in Users can view own scans policy';
  END IF;
END
$$;

-- Ownership behavior smoke-checks under simulated JWT claims.
-- These checks intentionally run as authenticated role to validate RLS behavior.

DO $$
DECLARE
  user_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  user_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  id_a uuid := gen_random_uuid();
  id_b uuid := gen_random_uuid();
  visible_for_a int;
  visible_for_b int;
BEGIN
  -- Cleanup in case previous run left rows.
  DELETE FROM public.scans WHERE user_id IN (user_a, user_b);

  -- Simulate inserts from service role (bypasses RLS by policy).
  INSERT INTO public.scans (id, user_id, filename, status)
  VALUES
    (id_a, user_a, 'a.pdf', 'done'),
    (id_b, user_b, 'b.pdf', 'done');

  -- User A context should see only own scan.
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', user_a::text, true);
  SELECT count(*) INTO visible_for_a FROM public.scans;
  IF visible_for_a <> 1 THEN
    RAISE EXCEPTION 'Ownership assertion failed: user A should see exactly 1 row, got %', visible_for_a;
  END IF;

  -- User B context should see only own scan.
  PERFORM set_config('request.jwt.claim.sub', user_b::text, true);
  SELECT count(*) INTO visible_for_b FROM public.scans;
  IF visible_for_b <> 1 THEN
    RAISE EXCEPTION 'Ownership assertion failed: user B should see exactly 1 row, got %', visible_for_b;
  END IF;

  -- Cleanup test data.
  DELETE FROM public.scans WHERE id IN (id_a, id_b);
END
$$;

COMMIT;
