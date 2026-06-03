CREATE POLICY "Admin/HR update nr1-pgr-docs in their company"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'nr1-pgr-docs'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_manager'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
  AND (storage.foldername(name))[1] IN (
    SELECT root_company_id::text FROM public.profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'nr1-pgr-docs'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_manager'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
  AND (storage.foldername(name))[1] IN (
    SELECT root_company_id::text FROM public.profiles WHERE id = auth.uid()
  )
);