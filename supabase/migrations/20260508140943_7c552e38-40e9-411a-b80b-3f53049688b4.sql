
-- =========================================================
-- RLS Tenant Isolation Audit Function
-- =========================================================
-- For every public table that:
--   * has Row Level Security enabled, AND
--   * has a `root_company_id` column
-- we probe it as a user from "company B" and check whether they can:
--   * SELECT rows belonging to company A   (USING clause coverage)
--   * UPDATE rows belonging to company A   (USING clause coverage)
--   * DELETE rows belonging to company A   (USING clause coverage)
--   * INSERT a row tagged with company A   (WITH CHECK clause coverage)
-- All UPDATE/DELETE/INSERT attempts run inside plpgsql subtransactions
-- and are FORCIBLY ROLLED BACK via a sentinel RAISE EXCEPTION,
-- so production data is never modified.
--
-- Caller must be a super_admin OR call with the service_role JWT.
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
BEGIN
  -- ------------------------------------------------------------------
  -- Authorization: super_admin OR service_role
  -- ------------------------------------------------------------------
  v_caller_role := COALESCE(
    current_setting('request.jwt.claims', true)::jsonb->>'role',
    ''
  );

  IF v_caller_role <> 'service_role'
     AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: super_admin or service_role required';
  END IF;

  -- ------------------------------------------------------------------
  -- Pick two real, distinct tenants and one user per tenant
  -- ------------------------------------------------------------------
  SELECT p.root_company_id, p.id
    INTO v_company_a, v_user_a
  FROM public.profiles p
  WHERE p.root_company_id IS NOT NULL
  ORDER BY p.created_at NULLS LAST
  LIMIT 1;

  SELECT p.root_company_id, p.id
    INTO v_company_b, v_user_b
  FROM public.profiles p
  WHERE p.root_company_id IS NOT NULL
    AND p.root_company_id <> v_company_a
  ORDER BY p.created_at NULLS LAST
  LIMIT 1;

  IF v_company_a IS NULL OR v_company_b IS NULL THEN
    RAISE EXCEPTION
      'RLS audit needs at least 2 distinct companies with users; found only company A=%, B=%',
      v_company_a, v_company_b;
  END IF;

  -- JWT we will impersonate user B with
  v_jwt_b := jsonb_build_object(
    'sub',  v_user_b::text,
    'role', 'authenticated'
  )::text;

  -- ------------------------------------------------------------------
  -- Loop through every RLS-enabled public table that carries a tenant id
  -- ------------------------------------------------------------------
  FOR v_table IN
    SELECT c.relname AS tname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity = true
      AND EXISTS (
        SELECT 1
        FROM information_schema.columns col
        WHERE col.table_schema = 'public'
          AND col.table_name   = c.relname
          AND col.column_name  = 'root_company_id'
      )
    ORDER BY c.relname
  LOOP
    -- =============================================================
    -- 1) SELECT cross-tenant
    -- =============================================================
    BEGIN
      PERFORM set_config('request.jwt.claims', v_jwt_b, true);
      EXECUTE 'SET LOCAL ROLE authenticated';

      EXECUTE format(
        'SELECT count(*) FROM public.%I WHERE root_company_id = $1',
        v_table.tname
      ) INTO v_count USING v_company_a;

      EXECUTE 'RESET ROLE';

      table_name := v_table.tname;
      operation  := 'SELECT';
      affected_rows := v_count;
      IF v_count = 0 THEN
        status  := 'PASS';
        details := 'User from company B cannot see any rows from company A';
      ELSE
        status  := 'FAIL';
        details := format('LEAK: user B sees %s rows from company A', v_count);
      END IF;
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      BEGIN EXECUTE 'RESET ROLE'; EXCEPTION WHEN OTHERS THEN NULL; END;
      table_name := v_table.tname;
      operation  := 'SELECT';
      status     := 'ERROR';
      details    := SQLERRM;
      affected_rows := 0;
      RETURN NEXT;
    END;

    -- =============================================================
    -- 2) UPDATE cross-tenant  (rolled back via sentinel exception)
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

      EXECUTE 'RESET ROLE';
      -- Force subtransaction rollback to discard any side effects
      RAISE EXCEPTION '__rls_audit__UPDATE__%', v_count
            USING ERRCODE = 'P0001';

    EXCEPTION WHEN OTHERS THEN
      BEGIN EXECUTE 'RESET ROLE'; EXCEPTION WHEN OTHERS THEN NULL; END;
      v_err := SQLERRM;

      table_name := v_table.tname;
      operation  := 'UPDATE';

      IF v_err LIKE '\_\_rls\_audit\_\_UPDATE\_\_%' ESCAPE '\' THEN
        v_count := NULLIF(substring(v_err from '__rls_audit__UPDATE__(\d+)'), '')::bigint;
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
        details := 'Non-RLS error: ' || v_err;
        affected_rows := 0;
      END IF;
      RETURN NEXT;
    END;

    -- =============================================================
    -- 3) DELETE cross-tenant  (rolled back via sentinel exception)
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

      EXECUTE 'RESET ROLE';
      RAISE EXCEPTION '__rls_audit__DELETE__%', v_count
            USING ERRCODE = 'P0001';

    EXCEPTION WHEN OTHERS THEN
      BEGIN EXECUTE 'RESET ROLE'; EXCEPTION WHEN OTHERS THEN NULL; END;
      v_err := SQLERRM;

      table_name := v_table.tname;
      operation  := 'DELETE';

      IF v_err LIKE '\_\_rls\_audit\_\_DELETE\_\_%' ESCAPE '\' THEN
        v_count := NULLIF(substring(v_err from '__rls_audit__DELETE__(\d+)'), '')::bigint;
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
        details := 'Non-RLS error: ' || v_err;
        affected_rows := 0;
      END IF;
      RETURN NEXT;
    END;

    -- =============================================================
    -- 4) INSERT with foreign tenant id (WITH CHECK coverage)
    --    Always rolled back (sentinel on success, normal rollback on error)
    -- =============================================================
    BEGIN
      PERFORM set_config('request.jwt.claims', v_jwt_b, true);
      EXECUTE 'SET LOCAL ROLE authenticated';

      EXECUTE format(
        'INSERT INTO public.%I (root_company_id) VALUES ($1)',
        v_table.tname
      ) USING v_company_a;

      EXECUTE 'RESET ROLE';
      RAISE EXCEPTION '__rls_audit__INSERT__1'
            USING ERRCODE = 'P0001';

    EXCEPTION WHEN OTHERS THEN
      BEGIN EXECUTE 'RESET ROLE'; EXCEPTION WHEN OTHERS THEN NULL; END;
      v_err := SQLERRM;

      table_name := v_table.tname;
      operation  := 'INSERT';

      IF v_err = '__rls_audit__INSERT__1' THEN
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
        -- NOT NULL / FK / unique constraint failures don't prove RLS works,
        -- but they prove RLS didn't allow a clean insert either.
        status  := 'INCONCLUSIVE';
        details := 'Constraint failure (could not isolate RLS effect): ' || v_err;
        affected_rows := 0;
      END IF;
      RETURN NEXT;
    END;

  END LOOP;
END;
$func$;

-- Lock down execute privileges
REVOKE ALL ON FUNCTION public.audit_rls_tenant_isolation() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_rls_tenant_isolation() FROM anon;
REVOKE ALL ON FUNCTION public.audit_rls_tenant_isolation() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.audit_rls_tenant_isolation() TO service_role;

COMMENT ON FUNCTION public.audit_rls_tenant_isolation() IS
'Regression test: probes every RLS-enabled public table with a root_company_id
 column for cross-tenant SELECT/UPDATE/DELETE/INSERT leaks. All mutations are
 rolled back. Callable only by super_admin or service_role.';
