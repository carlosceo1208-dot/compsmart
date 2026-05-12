CREATE POLICY "Super admins view all organizational structure"
ON public.organizational_structure
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));