DROP POLICY IF EXISTS "Everyone can view CBO codes" ON public.cbo_codes;
REVOKE SELECT ON public.cbo_codes FROM anon;
CREATE POLICY "Authenticated users can view CBO codes" ON public.cbo_codes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);