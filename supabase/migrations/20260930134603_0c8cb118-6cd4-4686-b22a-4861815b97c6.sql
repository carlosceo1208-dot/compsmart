REVOKE ALL ON FUNCTION public.nr1_convite_resolver(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nr1_convite_resolver(text) TO service_role;
REVOKE ALL ON FUNCTION public.nr1_submeter_respostas(text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nr1_submeter_respostas(text, uuid, jsonb) TO service_role;