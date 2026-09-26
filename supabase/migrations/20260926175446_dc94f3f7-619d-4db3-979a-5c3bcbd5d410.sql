ALTER TABLE public.job_families DROP CONSTRAINT IF EXISTS job_families_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS job_families_tenant_name_unique
  ON public.job_families (COALESCE(root_company_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));