REVOKE EXECUTE ON FUNCTION public.nr1_terceiros_pode_gerir(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nr1_terceiros_pode_gerir(uuid) TO authenticated, service_role;