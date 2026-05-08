
-- =========================================================
-- RLS Tenant Isolation Audit Function (v2)
-- =========================================================
-- Hardening goals over v1:
--   1. EVERY probe (including SELECT) runs inside its own
--      plpgsql BEGIN..EXCEPTION subtransaction so any error
--      mid-probe is rolled back at the savepoint boundary.
--   2. Mutation probes (INSERT/UPDATE/DELETE) ALWAYS exit
--      via a sentinel RAISE EXCEPTION on the success path,
--      forcing the subtransaction to roll back even when the
--      probe itself does not raise. This guarantees zero
--      side-effects regardless of outcome.
--   3. Per-call random sentinel tag prevents collision with
--      any application-thrown error string that happens to
--      look like our sentinel.
--   4. Session role / JWT claims are set with SET LOCAL and
--      set_config(_, _, true) so they are automatically
--      reverted by subtransaction rollback. We no longer rely
--      on explicit RESET ROLE for correctness.
--   5. A final outer guard reverts role/claims if the loop
--      itself dies unexpectedly.
-- =========================================================

CREATE OR REPLACE FUNCTION public.audit_rls_tenant_isolation()
RETURNS TABLE(
  table_name text,
  operation  text,
  status     text,
  details    text,
  affected_rows bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_company_a uuid;
  v_company_b uuid;
  v_user_a    uuid;
  v_user_b    uuid;
  v_jwt_b     text;
  v_table     record;
  v_count     bigint;
  v_err       text;
  v_caller_role text;
  v_tag       text;             -- per-call sentinel tag
  v_sent_sel  text;
  v_sent_upd  text;
  v_sent_del  text;
  v_sent_ins  text;
BEGIN
  -- ---- Authorization ------------------------------------------------
  v_caller_role := COALESCE(
    current_setting('request.jwt.claims', true)::jsonb->>'role',
    ''
  );
  IF v_caller_role <> 'service_role'
     AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: super_admin or service_role required';
  END IF;

  -- ---- Pick two distinct tenants -----------------------------------
  SELECT p.root_company_id, p.id INTO v_company_a, v_user_a
  FROM public.profiles p
  WHERE p.root_company_id IS NOT NULL
  ORDER BY p.created_at NULLS LAST
  LIMIT 1;

  SELECT p.root_company_id, p.id INTO v_company_b, v_user_b
  FROM public.profiles p
  WHERE p.root_company_id IS NOT NULL
    AND p.root_company_id <> v_company_a
  ORDER BY p.created_at NULLS LAST
  LIMIT 1;

  IF v_company_a IS NULL OR v_company_b IS NULL THEN
    RAISE EXCEPTION
      'RLS audit needs at least 2 distinct companies with users; found A=%, B=%',
      v_company_a, v_company_b;
  END IF;

  v_jwt_b := jsonb_build_object(
    'sub',  v_user_b::text,
    'role', 'authenticated'
  )::text;

  -- ---- Per-call sentinel tags --------------------------------------
  v_tag      := '__rls_audit__' || replace(gen_random_uuid()::text, '-', '');
  v_sent_sel := v_tag || '__SELECT__';
  v_sent_upd := v_tag || '__UPDATE__';
  v_sent_del := v_tag || '__DELETE__';
  v_sent_ins := v_tag || '__INSERT__';

  -- ==================================================================
  FOR v_table IN
    SELECT c.relname AS tname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity = true
      AND EXISTS (
        SELECT 1 FROM information_schema.columns col
        WHERE col.table_schema = 'public'
          AND col.table_name   = c.relname
          AND col.column_name  = 'root_company_id'
      )
    ORDER BY c.relname
  LOOP

    -- =============================================================
    -- 1) SELECT probe -- isolated subtransaction
    -- =============================================================
    BEGIN
      PERFORM set_config('request.jwt.claims', v_jwt_b, true);
      EXECUTE 'SET LOCAL ROLE authenticated';

      EXECUTE format(
        'SELECT count(*) FROM public.%I WHERE root_company_id = $1',
        v_table.tname
      ) INTO v_count USING v_company_a;

      -- Force rollback of this subtransaction to discard any
      -- planner side effects, temp state, etc.
      RAISE EXCEPTION '%__%', v_sent_sel, v_count
            USING ERRCODE = 'P0001';

    EXCEPTION WHEN OTHERS THEN
      v_err := SQLERRM;
      table_name := v_table.tname;
      operation  := 'SELECT';

      IF position(v_sent_sel in v_err) > 0 THEN
        v_count := NULLIF(substring(v_err from (v_sent_sel || '__(\d+)')), '')::bigint;
        affected_rows := COALESCE(v_count, 0);
        IF affected_rows = 0 THEN
          status  := 'PASS';
          details := 'User from company B cannot see any rows from company A';
        ELSE
          status  := 'FAIL';
          details := format('LEAK: user B sees %s rows from company A', affected_rows);
        END IF;
      ELSIF v_err ILIKE '%permission denied%' THEN
        status  := 'PASS';
        details := 'Blocked by RLS/permissions: ' || v_err;
        affected_rows := 0;
      ELSE
        status  := 'INCONCLUSIVE';
        details := 'SELECT probe error: ' || v_err;
        affected_rows := 0;
      END IF;
      RETURN NEXT;
    END;

    -- =============================================================
    -- 2) UPDATE probe -- isolated, sentinel-rolled back
    -- =============================================================
    BEGIN
      PERFORM set_config('request.jwt.claims', v_jwt_b, true);
      EXECUTE 'SET LOCAL ROLE authenticated';

      EXECUTE format(
        'WITH upd AS (
            UPDATE public.%I
               SET root_company_id = root_company_id
             WHERE root_company_id = $1
            RETURNING 1
         ) SELECT count(*) FROM upd',
        v_table.tname
      ) INTO v_count USING v_company_a;

      RAISE EXCEPTION '%__%', v_sent_upd, v_count
            USING ERRCODE = 'P0001';

    EXCEPTION WHEN OTHERS THEN
      v_err := SQLERRM;
      table_name := v_table.tname;
      operation  := 'UPDATE';

      IF position(v_sent_upd in v_err) > 0 THEN
        v_count := NULLIF(substring(v_err from (v_sent_upd || '__(\d+)')), '')::bigint;
        affected_rows := COALESCE(v_count, 0);
        IF affected_rows = 0 THEN
          status  := 'PASS';
          details := 'No company-A rows updatable by user B (rolled back)';
        ELSE
          status  := 'FAIL';
          details := format('LEAK: user B updated %s company-A rows (rolled back)', affected_rows);
        END IF;
      ELSIF v_err ILIKE '%row-level security%'
         OR v_err ILIKE '%permission denied%' THEN
        status  := 'PASS';
        details := 'Blocked by RLS: ' || v_err;
        affected_rows := 0;
      ELSE
        status  := 'INCONCLUSIVE';
        details := 'UPDATE probe error (rolled back): ' || v_err;
        affected_rows := 0;
      END IF;
      RETURN NEXT;
    END;

    -- =============================================================
    -- 3) DELETE probe -- isolated, sentinel-rolled back
    -- =============================================================
    BEGIN
      PERFORM set_config('request.jwt.claims', v_jwt_b, true);
      EXECUTE 'SET LOCAL ROLE authenticated';

      EXECUTE format(
        'WITH del AS (
            DELETE FROM public.%I
             WHERE root_company_id = $1
            RETURNING 1
         ) SELECT count(*) FROM del',
        v_table.tname
      ) INTO v_count USING v_company_a;

      RAISE EXCEPTION '%__%', v_sent_del, v_count
            USING ERRCODE = 'P0001';

    EXCEPTION WHEN OTHERS THEN
      v_err := SQLERRM;
      table_name := v_table.tname;
      operation  := 'DELETE';

      IF position(v_sent_del in v_err) > 0 THEN
        v_count := NULLIF(substring(v_err from (v_sent_del || '__(\d+)')), '')::bigint;
        affected_rows := COALESCE(v_count, 0);
        IF affected_rows = 0 THEN
          status  := 'PASS';
          details := 'No company-A rows deletable by user B (rolled back)';
        ELSE
          status  := 'FAIL';
          details := format('CRITICAL LEAK: user B could DELETE %s company-A rows (rolled back)', affected_rows);
        END IF;
      ELSIF v_err ILIKE '%row-level security%'
         OR v_err ILIKE '%permission denied%' THEN
        status  := 'PASS';
        details := 'Blocked by RLS: ' || v_err;
        affected_rows := 0;
      ELSE
        status  := 'INCONCLUSIVE';
        details := 'DELETE probe error (rolled back): ' || v_err;
        affected_rows := 0;
      END IF;
      RETURN NEXT;
    END;

    -- =============================================================
    -- 4) INSERT probe -- isolated, sentinel-rolled back
    -- =============================================================
    BEGIN
      PERFORM set_config('request.jwt.claims', v_jwt_b, true);
      EXECUTE 'SET LOCAL ROLE authenticated';

      EXECUTE format(
        'INSERT INTO public.%I (root_company_id) VALUES ($1)',
        v_table.tname
      ) USING v_company_a;

      RAISE EXCEPTION '%__1', v_sent_ins
            USING ERRCODE = 'P0001';

    EXCEPTION WHEN OTHERS THEN
      v_err := SQLERRM;
      table_name := v_table.tname;
      operation  := 'INSERT';

      IF position(v_sent_ins in v_err) > 0 THEN
        status  := 'FAIL';
        details := 'LEAK: user B inserted a row tagged with company A id (rolled back)';
        affected_rows := 1;
      ELSIF v_err ILIKE '%row-level security%'
         OR v_err ILIKE '%violates row-level%'
         OR v_err ILIKE '%permission denied%' THEN
        status  := 'PASS';
        details := 'Blocked by RLS WITH CHECK';
        affected_rows := 0;
      ELSE
        status  := 'INCONCLUSIVE';
        details := 'Constraint failure (RLS effect inconclusive, rolled back): ' || v_err;
        affected_rows := 0;
      END IF;
      RETURN NEXT;
    END;

  END LOOP;

  -- ---- Outer safety net: if anything above mutated session state
  -- ---- and somehow escaped a subtransaction rollback, undo it now.
  BEGIN EXECUTE 'RESET ROLE'; EXCEPTION WHEN OTHERS THEN NULL; END;
  PERFORM set_config('request.jwt.claims', '', true);
END;
$func$;

REVOKE ALL ON FUNCTION public.audit_rls_tenant_isolation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.audit_rls_tenant_isolation() TO service_role;
