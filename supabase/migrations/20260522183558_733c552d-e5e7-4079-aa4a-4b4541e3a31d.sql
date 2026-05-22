
REVOKE EXECUTE ON FUNCTION public.nr1_plano_transicao(uuid, public.nr1_aprovacao_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nr1_plano_transicao(uuid, public.nr1_aprovacao_status, text) TO authenticated;
