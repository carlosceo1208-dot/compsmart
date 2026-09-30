REVOKE ALL ON FUNCTION public.nr1_pode_gerir(uuid) FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.nr1_pode_gerir(uuid) SECURITY INVOKER;
GRANT EXECUTE ON FUNCTION public.nr1_pode_gerir(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.nr1_convite_resolver(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nr1_convite_resolver(text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.nr1_submeter_respostas(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nr1_submeter_respostas(text, jsonb) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.nr1_resultado_agregado(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nr1_resultado_agregado(uuid) TO authenticated, service_role;