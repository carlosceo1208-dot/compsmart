
CREATE OR REPLACE FUNCTION public.audit_sensitive_data_access()
RETURNS TABLE (
  table_name      text,
  sensitive_field text,
  status          text,
  details         text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec        record;
  policy_qual text;
  matched     boolean;
  rls_on      boolean;
  targets     text[][] := ARRAY[
    ARRAY['profiles',                'salary',                 '(has_role|auth\.uid\(\)|manager_id|is_company_admin|is_hr)'],
    ARRAY['profiles',                'variable_salary',        '(has_role|auth\.uid\(\)|manager_id|is_company_admin|is_hr)'],
    ARRAY['profiles',                'cpf',                    '(has_role|auth\.uid\(\)|is_company_admin|is_hr)'],
    ARRAY['profiles',                'birth_date',             '(has_role|auth\.uid\(\)|is_company_admin|is_hr|manager_id)'],
    ARRAY['performance_evaluations', 'final_score',            '(has_role|auth\.uid\(\)|manager_id|is_company_admin|is_hr)'],
    ARRAY['performance_goals',       'current_value',          '(has_role|auth\.uid\(\)|manager_id|is_company_admin|is_hr)'],
    ARRAY['performance_pdi',         'description',            '(has_role|auth\.uid\(\)|manager_id|is_company_admin|is_hr)'],
    ARRAY['organizational_structure','custom_monthly_price',   '(has_role|is_company_admin)'],
    ARRAY['organizational_structure','custom_annual_price',    '(has_role|is_company_admin)'],
    ARRAY['organizational_structure','billing_email',          '(has_role|is_company_admin)'],
    ARRAY['organizational_structure','cnpj',                   '(has_role|is_company_admin)']
  ];
  i int;
BEGIN
  FOR i IN 1 .. array_length(targets, 1) LOOP
    table_name      := targets[i][1];
    sensitive_field := targets[i][2];

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND information_schema.columns.table_name = targets[i][1]
        AND column_name = targets[i][2]
    ) THEN
      status := 'INCONCLUSIVE';
      details := 'Column not found (schema drift) — remove from audit list if intentional.';
      RETURN NEXT;
      CONTINUE;
    END IF;

    SELECT c.relrowsecurity INTO rls_on
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = targets[i][1];

    IF NOT COALESCE(rls_on, false) THEN
      status  := 'FAIL';
      details := 'RLS disabled on table — sensitive column is unrestricted.';
      RETURN NEXT;
      CONTINUE;
    END IF;

    matched := false;
    FOR policy_qual IN
      SELECT pg_get_expr(p.polqual, p.polrelid)
      FROM pg_policy p
      JOIN pg_class c ON c.oid = p.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = targets[i][1]
        AND p.polcmd IN ('r','*')
    LOOP
      IF policy_qual IS NOT NULL
         AND policy_qual ~* targets[i][3] THEN
        matched := true;
        EXIT;
      END IF;
    END LOOP;

    IF matched THEN
      status  := 'PASS';
      details := 'SELECT policy enforces role/self gating.';
    ELSE
      status  := 'FAIL';
      details := 'No SELECT/ALL policy references admin/HR/manager/self tokens — sensitive field may be over-exposed.';
    END IF;

    RETURN NEXT;
  END LOOP;
END;
$$;
