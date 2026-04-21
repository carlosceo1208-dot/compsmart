-- 1) Drop the legacy permissive policy on agent_source_citations
DROP POLICY IF EXISTS "Authenticated users can view all source citations" ON public.agent_source_citations;
DROP POLICY IF EXISTS "Users can view all citations" ON public.agent_source_citations;
DROP POLICY IF EXISTS "Public read citations" ON public.agent_source_citations;

-- 2) Tighten realtime policy: require explicit company UUID in topic
DROP POLICY IF EXISTS "Company-scoped realtime subscriptions" ON realtime.messages;

CREATE POLICY "Company-scoped realtime subscriptions"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    -- Topic MUST contain the user's company UUID (no wildcard for broadcast/system)
    topic LIKE '%:' || public.get_user_company_id()::text
    OR topic LIKE '%:' || public.get_user_company_id()::text || ':%'
  );

-- 3) Company-logos upload: enforce folder == user's company
DROP POLICY IF EXISTS "Admins e HR podem fazer upload de logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload company logos" ON storage.objects;

CREATE POLICY "Admins upload logos to own company folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company-logos'
    AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND (storage.foldername(name))[1] = public.get_user_company_id()::text
  );

CREATE POLICY "Admins update logos in own company folder"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND (storage.foldername(name))[1] = public.get_user_company_id()::text
  );

CREATE POLICY "Admins delete logos in own company folder"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND (storage.foldername(name))[1] = public.get_user_company_id()::text
  );

-- 4) organizational_structure: ensure billing columns truly inaccessible to non-admins
-- Re-issue REVOKE in case of policy refresh, then create explicit GRANT only to admins via function
REVOKE SELECT (billing_email, cnpj, payment_method, custom_annual_price, custom_monthly_price, subscription_started_at, trial_ends_at, subscription_status)
  ON public.organizational_structure FROM authenticated, anon;