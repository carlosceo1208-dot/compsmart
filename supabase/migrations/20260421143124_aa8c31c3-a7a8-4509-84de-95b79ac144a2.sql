-- =====================================================
-- FASE 2.4: SECURITY & LGPD HARDENING
-- =====================================================

-- 1) AGENT_SOURCE_CITATIONS — scope by company via conversation
DROP POLICY IF EXISTS "Authenticated users can view citations" ON public.agent_source_citations;
DROP POLICY IF EXISTS "Anyone can view citations" ON public.agent_source_citations;
DROP POLICY IF EXISTS "Users view citations" ON public.agent_source_citations;

CREATE POLICY "Citations scoped to user company"
  ON public.agent_source_citations
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.conversation_sessions cs
      WHERE cs.id = agent_source_citations.conversation_id
        AND cs.root_company_id = public.get_user_company_id()
    )
  );

-- 2) ORGANIZATIONAL_STRUCTURE — restrict billing/financial columns via column-level security
-- Strategy: keep base SELECT for non-sensitive use, but block direct access to billing columns
-- via a security barrier view + revoke direct table column privileges from authenticated.

REVOKE SELECT (billing_email, cnpj, payment_method, custom_annual_price, custom_monthly_price, subscription_started_at, trial_ends_at)
  ON public.organizational_structure FROM authenticated;

-- Helper: admins/HR can read full row through a SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.get_company_billing_details(p_company_id uuid)
RETURNS TABLE (
  id uuid,
  billing_email text,
  cnpj text,
  payment_method text,
  custom_annual_price numeric,
  custom_monthly_price numeric,
  subscription_started_at timestamptz,
  trial_ends_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.is_super_admin(auth.uid())
    OR (
      public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
      AND p_company_id = public.get_user_company_id()
    )
  ) THEN
    RAISE EXCEPTION 'Acesso negado a dados financeiros';
  END IF;

  RETURN QUERY
  SELECT os.id, os.billing_email, os.cnpj, os.payment_method,
         os.custom_annual_price, os.custom_monthly_price,
         os.subscription_started_at, os.trial_ends_at
  FROM public.organizational_structure os
  WHERE os.id = p_company_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_company_billing_details(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_company_billing_details(uuid) TO authenticated;

-- 3) STORAGE: VIDEOS bucket — enforce per-user folder ownership
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete videos" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own videos" ON storage.objects;

CREATE POLICY "Users upload videos to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users update own videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4) PUBLIC BUCKETS — block listing (allow individual object reads only)
-- Public buckets stay readable by URL but cannot be enumerated.
DROP POLICY IF EXISTS "Public bucket listing" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can list public buckets" ON storage.objects;

-- 5) REALTIME — scope channel subscriptions by company
-- Channel naming convention: <feature>:<root_company_id>
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can subscribe to any channel" ON realtime.messages;
DROP POLICY IF EXISTS "Company-scoped realtime subscriptions" ON realtime.messages;

CREATE POLICY "Company-scoped realtime subscriptions"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    -- Allow channels that include the user's company id in the topic name
    -- e.g. "kudos:<company_uuid>" or "notifications:<company_uuid>"
    topic LIKE '%' || public.get_user_company_id()::text || '%'
    -- Or system channels (no company scoping needed)
    OR topic LIKE 'system:%'
    OR topic LIKE 'broadcast:%'
  );