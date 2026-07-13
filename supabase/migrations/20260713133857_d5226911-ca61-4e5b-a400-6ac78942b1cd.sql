
DROP POLICY IF EXISTS "Admins can manage glossary terms" ON public.glossary_terms;
CREATE POLICY "Super admins can manage glossary terms"
  ON public.glossary_terms FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage quick actions" ON public.support_quick_actions;
