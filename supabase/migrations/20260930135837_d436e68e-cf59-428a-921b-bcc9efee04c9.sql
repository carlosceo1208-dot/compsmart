REVOKE EXECUTE ON FUNCTION public.nr1_resultado_grupo(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.nr1_resultado_grupo(uuid, text) TO service_role;