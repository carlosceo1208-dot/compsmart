-- Fix: prevent public/anon access to sensitive tables by scoping RLS policies to authenticated users
-- and tightening organizational_structure visibility (no global/NULL rows for regular users)

-- PROFILES (PII)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and HR managers can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and HR managers can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and HR view own company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins and HR view own company profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (auth.uid() = id)
  OR (
    root_company_id = public.get_user_company_id()
    AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
  )
);

CREATE POLICY "Admins and HR managers can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  root_company_id = public.get_user_company_id()
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
);

CREATE POLICY "Admins and HR managers can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = id)
  OR (
    root_company_id = public.get_user_company_id()
    AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
  )
)
WITH CHECK (
  -- Prevent moving a profile to another company
  root_company_id = public.get_user_company_id()
  OR auth.uid() = id
);


-- ORGANIZATIONAL_STRUCTURE (company financial/subscription data)
ALTER TABLE public.organizational_structure ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and HR managers can manage organizational structure" ON public.organizational_structure;
DROP POLICY IF EXISTS "Users view own company structure" ON public.organizational_structure;

CREATE POLICY "Users view own company structure"
ON public.organizational_structure
FOR SELECT
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR root_company_id = public.get_user_company_id()
  OR id = public.get_user_company_id()
);

CREATE POLICY "Admins and HR managers can manage organizational structure"
ON public.organizational_structure
FOR ALL
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
  AND (
    root_company_id = public.get_user_company_id()
    OR id = public.get_user_company_id()
  )
)
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
  AND (
    root_company_id = public.get_user_company_id()
    OR id = public.get_user_company_id()
  )
);
