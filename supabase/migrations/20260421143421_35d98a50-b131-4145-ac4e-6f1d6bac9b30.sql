-- 1) PROFILES: prevent root_company_id tampering on self-update
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profile self update" ON public.profiles;

CREATE POLICY "Users update own profile (no company change)"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND root_company_id = (SELECT root_company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Admin/HR can still update any profile in their company
CREATE POLICY "Admins update profiles in own company"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND root_company_id = public.get_user_company_id()
  )
  WITH CHECK (
    root_company_id = public.get_user_company_id()
  );

-- 2) VIDEOS: drop legacy permissive policies
DROP POLICY IF EXISTS "Delete de vídeos para admins" ON storage.objects;
DROP POLICY IF EXISTS "Upload de vídeos para autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Public read videos" ON storage.objects;

-- 3) AVATARS: scope admin actions to own-company users
DROP POLICY IF EXISTS "Admins can manage all avatars" ON storage.objects;

CREATE POLICY "Admins manage avatars of own company"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.root_company_id = public.get_user_company_id()
    )
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.root_company_id = public.get_user_company_id()
    )
  );

-- 4) COMPANY-LOGOS: drop unscoped duplicates
DROP POLICY IF EXISTS "Admins e HR podem atualizar logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins e HR podem deletar logos" ON storage.objects;

-- 5) MERIT RECOMMENDATIONS: only show approved to employees
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'merit_recommendations') THEN
    EXECUTE 'DROP POLICY IF EXISTS "View merit recommendations" ON public.merit_recommendations';
    EXECUTE 'CREATE POLICY "Employees view own approved merit recommendations"
      ON public.merit_recommendations FOR SELECT
      TO authenticated
      USING (
        (employee_id = auth.uid() AND status IN (''approved'', ''completed''))
        OR public.has_any_role(auth.uid(), ARRAY[''admin''::app_role, ''hr_manager''::app_role, ''manager''::app_role])
      )';
  END IF;
END $$;