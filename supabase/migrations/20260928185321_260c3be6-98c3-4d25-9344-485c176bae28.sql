ALTER TABLE public.vagas
  ADD COLUMN IF NOT EXISTS logo_path text,
  ADD COLUMN IF NOT EXISTS sobre_empresa text;
ALTER TABLE public.vagas ADD CONSTRAINT vagas_sobre_empresa_len CHECK (sobre_empresa IS NULL OR char_length(sobre_empresa) <= 600);
ALTER TABLE public.vagas ADD CONSTRAINT vagas_confidencial_sem_faixa CHECK (NOT (visibilidade = 'confidencial' AND exibir_faixa));
ALTER TABLE public.vagas ADD CONSTRAINT vagas_logo_path_tenant CHECK (logo_path IS NULL OR split_part(logo_path, '/', 1) = root_company_id::text);

DROP FUNCTION IF EXISTS public.portal_listar_vagas();
DROP FUNCTION IF EXISTS public.portal_vaga(text);

CREATE FUNCTION public.portal_listar_vagas() RETURNS TABLE(
  slug text, titulo text, area text, senioridade text, modelo_trabalho text, tipo_contratacao text,
  cidade text, uf text, faixa_salarial_min numeric, faixa_salarial_max numeric, empresa text, publicada_em timestamptz,
  logo_path text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.slug, v.titulo, v.area, v.senioridade, v.modelo_trabalho, v.tipo_contratacao, v.cidade, v.uf,
    CASE WHEN v.exibir_faixa THEN v.faixa_salarial_min END, CASE WHEN v.exibir_faixa THEN v.faixa_salarial_max END,
    public.talent_empresa_publica(v), v.updated_at,
    CASE WHEN v.exibir_nome_empresa THEN v.logo_path END
  FROM public.vagas v
  WHERE v.status = 'publicada' AND v.visibilidade = 'publica' AND public.talent_company_has_module(v.root_company_id)
  ORDER BY v.updated_at DESC LIMIT 200
$$;

CREATE FUNCTION public.portal_vaga(_slug text) RETURNS TABLE(
  slug text, titulo text, area text, senioridade text, modelo_trabalho text, tipo_contratacao text,
  cidade text, uf text, faixa_salarial_min numeric, faixa_salarial_max numeric, empresa text,
  confidencial boolean, responsabilidades text, requisitos_obrigatorios text, requisitos_desejaveis text,
  competencias text[], qtd_vagas int, logo_path text, sobre_empresa text, empresa_identificada boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.slug, v.titulo, v.area, v.senioridade, v.modelo_trabalho, v.tipo_contratacao, v.cidade, v.uf,
    CASE WHEN v.exibir_faixa THEN v.faixa_salarial_min END, CASE WHEN v.exibir_faixa THEN v.faixa_salarial_max END,
    public.talent_empresa_publica(v), v.visibilidade = 'confidencial',
    v.responsabilidades, v.requisitos_obrigatorios, v.requisitos_desejaveis, v.competencias, v.qtd_vagas,
    CASE WHEN v.visibilidade = 'publica' AND v.exibir_nome_empresa THEN v.logo_path END,
    CASE WHEN v.visibilidade = 'publica' AND v.exibir_nome_empresa THEN v.sobre_empresa END,
    v.visibilidade = 'publica' AND v.exibir_nome_empresa
  FROM public.vagas v
  WHERE v.slug = _slug AND v.status = 'publicada' AND public.talent_company_has_module(v.root_company_id)
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.portal_listar_vagas() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.portal_vaga(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.portal_listar_vagas() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.portal_vaga(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.talent_logo_visivel(_path text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.vagas v WHERE v.logo_path = _path AND v.status = 'publicada'
    AND v.visibilidade = 'publica' AND v.exibir_nome_empresa AND public.talent_company_has_module(v.root_company_id))
$$;
GRANT EXECUTE ON FUNCTION public.talent_logo_visivel(text) TO anon, authenticated;

CREATE POLICY "Logos vagas: leitura publica restrita" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'logos-vagas' AND public.talent_logo_visivel(name));
CREATE POLICY "Logos vagas: RH le" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'logos-vagas' AND (((storage.foldername(name))[1] = public.get_user_company_id()::text
  AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_manager'))) OR public.has_role(auth.uid(),'super_admin')));
CREATE POLICY "Logos vagas: RH grava" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'logos-vagas' AND (storage.foldername(name))[1] = public.get_user_company_id()::text
  AND public.has_module('talent') AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_manager'))
  AND lower(storage.extension(name)) IN ('png','jpg','jpeg','webp'));
CREATE POLICY "Logos vagas: RH altera" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'logos-vagas' AND (storage.foldername(name))[1] = public.get_user_company_id()::text
  AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_manager')))
WITH CHECK (bucket_id = 'logos-vagas' AND (storage.foldername(name))[1] = public.get_user_company_id()::text
  AND lower(storage.extension(name)) IN ('png','jpg','jpeg','webp'));
CREATE POLICY "Logos vagas: RH apaga" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'logos-vagas' AND (((storage.foldername(name))[1] = public.get_user_company_id()::text
  AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_manager'))) OR public.has_role(auth.uid(),'super_admin')));