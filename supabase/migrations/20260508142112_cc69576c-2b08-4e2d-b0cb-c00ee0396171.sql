
CREATE OR REPLACE FUNCTION public.test_audit_rollback_on_insert_failure()
RETURNS TABLE(
  scenario text,
  status   text,
  details  text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_caller_role text;
  v_company_a uuid;
  v_company_b uuid;
  v_seed_rows int := 5;
  v_count_before bigint;
  v_count_after  bigint;
  v_total_before bigint;
  v_total_after  bigint;
  v_audit_row record;
  v_insert_seen boolean := false;
  v_rollback_ok boolean;
BEGIN
  -- ---- Authorization ----------------------------------------------
  v_caller_role := COALESCE(
    current_setting('request.jwt.claims', true)::jsonb->>'role', ''
  );
  IF v_caller_role <> 'service_role'
     AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: super_admin or service_role required';
  END IF;

  -- ---- Pick two distinct tenants (same logic as the audit) --------
  SELECT root_company_id INTO v_company_a
  FROM public.profiles
  WHERE root_company_id IS NOT NULL
  ORDER BY created_at NULLS LAST LIMIT 1;

  SELECT root_company_id INTO v_company_b
  FROM public.profiles
  WHERE root_company_id IS NOT NULL AND root_company_id <> v_company_a
  ORDER BY created_at NULLS LAST LIMIT 1;

  IF v_company_a IS NULL OR v_company_b IS NULL THEN
    scenario := 'fixture';
    status := 'SKIP';
    details := 'Need 2 distinct companies in profiles to run this test';
    RETURN NEXT;
    RETURN;
  END IF;

  -- ---- Build an isolated test table the audit will pick up --------
  -- Drop any leftover from a previous failed run
  EXECUTE 'DROP TABLE IF EXISTS public._rls_audit_selftest CASCADE';

  EXECUTE $sql$
    CREATE TABLE public._rls_audit_selftest (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      root_company_id uuid NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  $sql$;

  EXECUTE 'ALTER TABLE public._rls_audit_selftest ENABLE ROW LEVEL SECURITY';

  -- Permissive policies so the audit's probes ACTUALLY reach the
  -- trigger (we want to test rollback after a real partial mutation).
  EXECUTE $sql$
    CREATE POLICY "selftest_select_all" ON public._rls_audit_selftest
      FOR SELECT TO authenticated USING (true)
  $sql$;
  EXECUTE $sql$
    CREATE POLICY "selftest_insert_all" ON public._rls_audit_selftest
      FOR INSERT TO authenticated WITH CHECK (true)
  $sql$;
  EXECUTE $sql$
    CREATE POLICY "selftest_update_all" ON public._rls_audit_selftest
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true)
  $sql$;
  EXECUTE $sql$
    CREATE POLICY "selftest_delete_all" ON public._rls_audit_selftest
      FOR DELETE TO authenticated USING (true)
  $sql$;

  -- Seed baseline rows for company A
  INSERT INTO public._rls_audit_selftest (root_company_id)
  SELECT v_company_a FROM generate_series(1, v_seed_rows);

  -- ---- The "trip wire": trigger that always raises on INSERT ------
  CREATE OR REPLACE FUNCTION public._rls_audit_selftest_blowup()
  RETURNS trigger
  LANGUAGE plpgsql
  AS $trg$
  BEGIN
    -- Simulate an unexpected mid-statement failure AFTER the row
    -- has been written to the table buffer. This exercises the
    -- rollback path of the audit's INSERT probe.
    RAISE EXCEPTION 'selftest: simulated mid-INSERT failure'
          USING ERRCODE = 'P0001';
    RETURN NEW;
  END;
  $trg$;

  EXECUTE $sql$
    CREATE TRIGGER _rls_audit_selftest_blowup_t
      BEFORE INSERT ON public._rls_audit_selftest
      FOR EACH ROW EXECUTE FUNCTION public._rls_audit_selftest_blowup()
  $sql$;

  -- ---- Snapshot BEFORE running the audit --------------------------
  SELECT count(*) INTO v_count_before
  FROM public._rls_audit_selftest WHERE root_company_id = v_company_a;
  SELECT count(*) INTO v_total_before FROM public._rls_audit_selftest;

  -- ---- Run the audit and capture the row for our test table ------
  v_rollback_ok := true;
  FOR v_audit_row IN
    SELECT * FROM public.audit_rls_tenant_isolation()
    WHERE table_name = '_rls_audit_selftest'
  LOOP
    IF v_audit_row.operation = 'INSERT' THEN
      v_insert_seen := true;
      scenario := 'insert_probe_observed_status';
      status := v_audit_row.status;
      details := v_audit_row.details;
      RETURN NEXT;

      -- We expect the audit to classify the trigger failure as
      -- INCONCLUSIVE (rolled back) or PASS — anything implying a
      -- persisted change is a hard failure of this self-test.
      IF v_audit_row.status = 'FAIL'
         AND v_audit_row.details ILIKE '%CRITICAL: persisted change%' THEN
        v_rollback_ok := false;
      END IF;
    END IF;
  END LOOP;

  -- ---- Snapshot AFTER running the audit ---------------------------
  SELECT count(*) INTO v_count_after
  FROM public._rls_audit_selftest WHERE root_company_id = v_company_a;
  SELECT count(*) INTO v_total_after FROM public._rls_audit_selftest;

  scenario := 'insert_probe_was_executed';
  IF v_insert_seen THEN
    status := 'PASS';
    details := 'Audit emitted an INSERT probe row for the self-test table';
  ELSE
    status := 'FAIL';
    details := 'Audit did not emit an INSERT probe row for _rls_audit_selftest';
  END IF;
  RETURN NEXT;

  scenario := 'no_persisted_mutation_after_failure';
  IF v_count_before = v_count_after
     AND v_total_before = v_total_after
     AND v_rollback_ok THEN
    status := 'PASS';
    details := format(
      'Row counts unchanged: company-A %s→%s, total %s→%s',
      v_count_before, v_count_after, v_total_before, v_total_after
    );
  ELSE
    status := 'FAIL';
    details := format(
      'PERSISTED MUTATION! company-A %s→%s, total %s→%s, rollback_flag=%s',
      v_count_before, v_count_after, v_total_before, v_total_after, v_rollback_ok
    );
  END IF;
  RETURN NEXT;

  -- ---- Cleanup ----------------------------------------------------
  EXECUTE 'DROP TABLE IF EXISTS public._rls_audit_selftest CASCADE';
  EXECUTE 'DROP FUNCTION IF EXISTS public._rls_audit_selftest_blowup() CASCADE';

EXCEPTION WHEN OTHERS THEN
  -- Always cleanup, even if the test itself errors
  BEGIN EXECUTE 'DROP TABLE IF EXISTS public._rls_audit_selftest CASCADE';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN EXECUTE 'DROP FUNCTION IF EXISTS public._rls_audit_selftest_blowup() CASCADE';
  EXCEPTION WHEN OTHERS THEN NULL; END;
  RAISE;
END;
$func$;

REVOKE ALL ON FUNCTION public.test_audit_rollback_on_insert_failure() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.test_audit_rollback_on_insert_failure() TO service_role;
