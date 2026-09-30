ALTER FUNCTION public.nr1_pode_gerir(uuid) SECURITY DEFINER;
REVOKE EXECUTE ON FUNCTION public.nr1_pode_gerir(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.nr1_pode_gerir(uuid) TO authenticated, service_role;