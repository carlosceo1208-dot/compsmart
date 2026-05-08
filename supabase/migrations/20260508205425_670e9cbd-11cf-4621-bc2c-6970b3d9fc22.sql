
-- 1) Restrict sensitive billing columns on organizational_structure
-- Keep row-level visibility for company members but block direct column reads of
-- truly sensitive billing fields. Admins/HR access these via the existing
-- get_company_billing_info / get_company_billing_details SECURITY DEFINER RPCs.
REVOKE SELECT (cnpj, billing_email, custom_monthly_price, custom_annual_price)
  ON public.organizational_structure FROM authenticated, anon, PUBLIC;

-- 2) Fix avatar storage policies: scope to authenticated role only
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- 3) Scope knowledge_base admin/HR writes to their own company.
-- Global entries (root_company_id IS NULL) are managed by super_admin only.
DROP POLICY IF EXISTS "Admins and HR can manage knowledge base" ON public.knowledge_base;

CREATE POLICY "Admins and HR manage own company knowledge base"
  ON public.knowledge_base FOR ALL TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND root_company_id IS NOT NULL
    AND root_company_id = get_user_company_id()
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND root_company_id IS NOT NULL
    AND root_company_id = get_user_company_id()
  );

CREATE POLICY "Super admins manage all knowledge base"
  ON public.knowledge_base FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
