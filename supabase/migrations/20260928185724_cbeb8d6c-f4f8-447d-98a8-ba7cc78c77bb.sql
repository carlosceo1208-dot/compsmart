DROP FUNCTION IF EXISTS public.portal_listar_vagas();
CREATE FUNCTION public.portal_listar_vagas() RETURNS TABLE(
  slug text, titulo text, area text, senioridade text, modelo_trabalho text, tipo_contratacao text,
  cidade text, uf text, faixa_salarial_min numeric, faixa_salarial_max numeric, empresa text, publicada_em timestamptz,
  logo_path text, empresa_identificada boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.slug, v.titulo, v.area, v.senioridade, v.modelo_trabalho, v.tipo_contratacao, v.cidade, v.uf,
    CASE WHEN v.exibir_faixa THEN v.faixa_salarial_min END, CASE WHEN v.exibir_faixa THEN v.faixa_salarial_max END,
    public.talent_empresa_publica(v), v.updated_at,
    CASE WHEN v.exibir_nome_empresa THEN v.logo_path END, v.exibir_nome_empresa
  FROM public.vagas v
  WHERE v.status = 'publicada' AND v.visibilidade = 'publica' AND public.talent_company_has_module(v.root_company_id)
  ORDER BY v.updated_at DESC LIMIT 200
$$;
REVOKE ALL ON FUNCTION public.portal_listar_vagas() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.portal_listar_vagas() TO anon, authenticated, service_role;