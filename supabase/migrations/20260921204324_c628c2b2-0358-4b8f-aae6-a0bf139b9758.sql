REVOKE EXECUTE ON FUNCTION public.rh_service_validar_resposta() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_service_validar_datas_projeto() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_service_preencher_nivel() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_service_marcar_reco_editada() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_service_can_read(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rh_service_can_write(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rh_service_calcular_nivel(numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rh_service_calcular_scores(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rh_service_gerar_recomendacoes(uuid, numeric) FROM anon;