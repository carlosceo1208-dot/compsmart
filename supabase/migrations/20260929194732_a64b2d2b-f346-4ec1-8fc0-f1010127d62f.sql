REVOKE EXECUTE ON FUNCTION public.maturidade_pode_gerir(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.maturidade_questoes_gestor(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.maturidade_registrar_gestor(uuid,jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.maturidade_scorecard(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.maturidade_empresas() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.maturidade_ip_hash() FROM PUBLIC, anon, authenticated;