CREATE POLICY "Curriculos: RH da empresa apaga"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'curriculos'
  AND (
    (
      (storage.foldername(name))[1] = (public.get_user_company_id())::text
      AND public.has_module('talent')
      AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'hr_manager'::public.app_role))
    )
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  )
);