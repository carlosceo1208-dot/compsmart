
DO $$
DECLARE
  rec RECORD;
  cols text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='approval_sla_config' AND policyname='Authenticated can view SLA in their company') THEN
    EXECUTE 'ALTER POLICY "Authenticated can view SLA in their company" ON public.approval_sla_config TO authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='budget_employee_projections' AND policyname='Delete projections policy') THEN
    EXECUTE 'ALTER POLICY "Delete projections policy" ON public.budget_employee_projections TO authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='decision_scenario_items' AND policyname='View items via scenario access') THEN
    EXECUTE 'ALTER POLICY "View items via scenario access" ON public.decision_scenario_items TO authenticated';
  END IF;

  FOR rec IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname='public'
      AND tablename IN ('job_matching_history','job_matching_results')
      AND 'public' = ANY(roles)
  LOOP
    EXECUTE format('ALTER POLICY %I ON public.%I TO authenticated', rec.policyname, rec.tablename);
  END LOOP;

  -- organizational_structure: revoke billing column SELECT
  REVOKE SELECT (cnpj, billing_email, payment_method, custom_monthly_price, custom_annual_price, subscription_started_at)
    ON public.organizational_structure FROM PUBLIC;
  REVOKE SELECT (cnpj, billing_email, payment_method, custom_monthly_price, custom_annual_price, subscription_started_at)
    ON public.organizational_structure FROM authenticated;
  REVOKE SELECT (cnpj, billing_email, payment_method, custom_monthly_price, custom_annual_price, subscription_started_at)
    ON public.organizational_structure FROM anon;

  SELECT string_agg(quote_ident(column_name), ', ')
    INTO cols
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='organizational_structure'
    AND column_name NOT IN ('cnpj','billing_email','payment_method','custom_monthly_price','custom_annual_price','subscription_started_at');
  EXECUTE format('GRANT SELECT (%s) ON public.organizational_structure TO authenticated', cols);
END $$;
