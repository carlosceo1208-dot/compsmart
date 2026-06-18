REVOKE EXECUTE ON FUNCTION public.update_job_title_salary_range() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_job_title_salary_range() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_job_title_salary_range() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.update_job_title_salary_range() TO service_role;