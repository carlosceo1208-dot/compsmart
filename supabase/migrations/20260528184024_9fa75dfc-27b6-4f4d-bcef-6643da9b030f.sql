
ALTER TABLE public.organizational_structure DROP COLUMN IF EXISTS payment_method;

DROP POLICY IF EXISTS "Admins can view company user feedback" ON public.user_feedback;
CREATE POLICY "Admins can view company user feedback"
ON public.user_feedback
FOR SELECT
TO authenticated
USING (
  public.is_super_admin()
  OR (
    root_company_id IS NOT NULL
    AND public.has_role(auth.uid(), 'admin'::app_role)
    AND root_company_id = public.get_user_company_id()
  )
);

ALTER PUBLICATION supabase_realtime DROP TABLE public.performance_kudos;
