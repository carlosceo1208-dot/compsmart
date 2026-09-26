-- ===== vagas: slug, visibilidade, exibição =====
ALTER TABLE public.vagas
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS exibir_faixa boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visibilidade text NOT NULL DEFAULT 'publica',
  ADD COLUMN IF NOT EXISTS exibir_nome_empresa boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS descricao_publica_cliente text;
ALTER TABLE public.vagas ADD CONSTRAINT vagas_visibilidade_check CHECK (visibilidade IN ('publica','confidencial'));
ALTER TABLE public.vagas ADD CONSTRAINT vagas_desc_publica_len CHECK (descricao_publica_cliente IS NULL OR char_length(descricao_publica_cliente) <= 160);

CREATE OR REPLACE FUNCTION public.talent_slugify(_t text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT left(trim(both '-' from regexp_replace(lower(public.unaccent_safe(coalesce(_t,'vaga'))), '[^a-z0-9]+', '-', 'g')), 60)
$$;

CREATE OR REPLACE FUNCTION public.vagas_before_write() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _base text; _cand text; _n int := 1;
BEGIN
  IF NEW.visibilidade = 'confidencial' THEN
    NEW.exibir_nome_empresa := false; NEW.exibir_faixa := false;
  END IF;
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    _base := coalesce(nullif(public.talent_slugify(NEW.titulo), ''), 'vaga');
    _cand := _base;
    PERFORM pg_advisory_xact_lock(hashtext('vagas_slug'));
    WHILE EXISTS (SELECT 1 FROM public.vagas WHERE slug = _cand AND id <> NEW.id) LOOP
      _n := _n + 1; _cand := _base || '-' || _n;
    END LOOP;
    NEW.slug := _cand;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER vagas_before_write BEFORE INSERT OR UPDATE ON public.vagas
FOR EACH ROW EXECUTE FUNCTION public.vagas_before_write();

UPDATE public.vagas SET slug = NULL WHERE slug IS NULL; -- dispara geração de slug no backfill
ALTER TABLE public.vagas ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX vagas_slug_key ON public.vagas(slug);

-- ===== candidatos =====
CREATE TABLE public.candidatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  root_company_id uuid NOT NULL,
  nome text NOT NULL CHECK (char_length(nome) BETWEEN 2 AND 150),
  email text NOT NULL CHECK (email = lower(email) AND char_length(email) <= 255),
  telefone text CHECK (telefone IS NULL OR char_length(telefone) <= 30),
  cargo_pretendido text CHECK (cargo_pretendido IS NULL OR char_length(cargo_pretendido) <= 150),
  senioridade text CHECK (senioridade IS NULL OR senioridade IN ('junior','pleno','senior','especialista','profissional','consultor')),
  observacoes text CHECK (observacoes IS NULL OR char_length(observacoes) <= 2000),
  curriculo_url text,
  fonte text NOT NULL CHECK (fonte IN ('rh','portal')),
  consentimento_lgpd boolean NOT NULL DEFAULT false,
  consentimento_data timestamptz,
  consentimento_versao text,
  consentimento_ip text,
  consentimento_user_agent text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (root_company_id, email)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidatos TO authenticated;
GRANT ALL ON public.candidatos TO service_role;
ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Candidatos: RH da empresa gerencia" ON public.candidatos FOR ALL TO authenticated
USING ((root_company_id = public.get_user_company_id() AND public.has_module('talent')
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_manager'))) OR public.has_role(auth.uid(),'super_admin'))
WITH CHECK ((root_company_id = public.get_user_company_id() AND public.has_module('talent')
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_manager'))) OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER update_candidatos_updated_at BEFORE UPDATE ON public.candidatos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== candidaturas =====
CREATE TABLE public.candidaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  root_company_id uuid NOT NULL,
  candidato_id uuid NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
  vaga_id uuid NOT NULL REFERENCES public.vagas(id) ON DELETE CASCADE,
  etapa text NOT NULL DEFAULT 'triagem' CHECK (etapa IN ('triagem','entrevista_rh','entrevista_gestor','proposta','contratado')),
  status text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa','reprovada','desistiu','contratada')),
  match_score numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (candidato_id, vaga_id)
);
CREATE INDEX candidaturas_vaga_idx ON public.candidaturas(vaga_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidaturas TO authenticated;
GRANT ALL ON public.candidaturas TO service_role;
ALTER TABLE public.candidaturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Candidaturas: RH da empresa gerencia" ON public.candidaturas FOR ALL TO authenticated
USING ((root_company_id = public.get_user_company_id() AND public.has_module('talent')
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_manager'))) OR public.has_role(auth.uid(),'super_admin'))
WITH CHECK ((root_company_id = public.get_user_company_id() AND public.has_module('talent')
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_manager'))) OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER update_candidaturas_updated_at BEFORE UPDATE ON public.candidaturas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- candidatura sempre na mesma empresa da vaga e do candidato
CREATE OR REPLACE FUNCTION public.candidaturas_check_tenant() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT root_company_id INTO NEW.root_company_id FROM public.vagas WHERE id = NEW.vaga_id;
  IF NOT EXISTS (SELECT 1 FROM public.candidatos WHERE id = NEW.candidato_id AND root_company_id = NEW.root_company_id) THEN
    RAISE EXCEPTION 'Candidato e vaga de empresas diferentes';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER candidaturas_check_tenant BEFORE INSERT OR UPDATE ON public.candidaturas
FOR EACH ROW EXECUTE FUNCTION public.candidaturas_check_tenant();

-- ===== limite de tentativas do portal (por IP, só servidor) =====
CREATE TABLE public.portal_rate_limit (
  id bigserial PRIMARY KEY,
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX portal_rate_limit_idx ON public.portal_rate_limit(ip_hash, created_at);
GRANT ALL ON public.portal_rate_limit TO service_role;
GRANT USAGE ON SEQUENCE public.portal_rate_limit_id_seq TO service_role;
ALTER TABLE public.portal_rate_limit ENABLE ROW LEVEL SECURITY;

-- ===== portal público =====
CREATE OR REPLACE FUNCTION public.talent_company_has_module(_company uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.tenant_subscriptions ts JOIN public.modules m ON m.id = ts.module_id
    WHERE ts.tenant_id = _company AND m.slug = 'talent' AND ts.status IN ('active','trial')
      AND (ts.expires_at IS NULL OR ts.expires_at > now()))
$$;

CREATE OR REPLACE FUNCTION public.talent_empresa_publica(_v public.vagas) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN _v.visibilidade = 'confidencial' THEN coalesce(nullif(trim(_v.descricao_publica_cliente),''), 'Empresa confidencial')
    WHEN NOT _v.exibir_nome_empresa THEN coalesce(nullif(trim(_v.descricao_publica_cliente),''), 'Empresa não identificada')
    ELSE coalesce((SELECT name FROM public.organizational_structure WHERE id = _v.root_company_id), 'Empresa')
  END
$$;

CREATE OR REPLACE FUNCTION public.portal_listar_vagas() RETURNS TABLE(
  slug text, titulo text, area text, senioridade text, modelo_trabalho text, tipo_contratacao text,
  cidade text, uf text, faixa_salarial_min numeric, faixa_salarial_max numeric, empresa text, publicada_em timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.slug, v.titulo, v.area, v.senioridade, v.modelo_trabalho, v.tipo_contratacao, v.cidade, v.uf,
    CASE WHEN v.exibir_faixa THEN v.faixa_salarial_min END, CASE WHEN v.exibir_faixa THEN v.faixa_salarial_max END,
    public.talent_empresa_publica(v), v.updated_at
  FROM public.vagas v
  WHERE v.status = 'publicada' AND v.visibilidade = 'publica' AND public.talent_company_has_module(v.root_company_id)
  ORDER BY v.updated_at DESC LIMIT 200
$$;

CREATE OR REPLACE FUNCTION public.portal_vaga(_slug text) RETURNS TABLE(
  slug text, titulo text, area text, senioridade text, modelo_trabalho text, tipo_contratacao text,
  cidade text, uf text, faixa_salarial_min numeric, faixa_salarial_max numeric, empresa text,
  confidencial boolean, responsabilidades text, requisitos_obrigatorios text, requisitos_desejaveis text,
  competencias text[], qtd_vagas int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.slug, v.titulo, v.area, v.senioridade, v.modelo_trabalho, v.tipo_contratacao, v.cidade, v.uf,
    CASE WHEN v.exibir_faixa THEN v.faixa_salarial_min END, CASE WHEN v.exibir_faixa THEN v.faixa_salarial_max END,
    public.talent_empresa_publica(v), v.visibilidade = 'confidencial',
    v.responsabilidades, v.requisitos_obrigatorios, v.requisitos_desejaveis, v.competencias, v.qtd_vagas
  FROM public.vagas v
  WHERE v.slug = _slug AND v.status = 'publicada' AND public.talent_company_has_module(v.root_company_id)
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.talent_empresa_publica(public.vagas) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_listar_vagas() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_vaga(text) TO anon, authenticated;

-- ===== cadastro pelo RH (sem duplicar por e-mail) =====
CREATE OR REPLACE FUNCTION public.talent_upsert_candidato(
  _nome text, _email text, _telefone text, _cargo text, _senioridade text, _observacoes text, _vaga_ids uuid[]
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _company uuid := public.get_user_company_id();
  _mail text := lower(trim(_email));
  _id uuid; _existed boolean := false; _v uuid; _novas int := 0;
BEGIN
  IF _company IS NULL OR NOT ((public.has_module('talent') AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_manager')))
     OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  IF _mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'E-mail inválido'; END IF;
  IF char_length(coalesce(trim(_nome),'')) < 2 THEN RAISE EXCEPTION 'Nome inválido'; END IF;

  PERFORM pg_advisory_xact_lock(hashtext(_company::text || _mail));
  SELECT id INTO _id FROM public.candidatos WHERE root_company_id = _company AND email = _mail;
  IF _id IS NULL THEN
    INSERT INTO public.candidatos (root_company_id, nome, email, telefone, cargo_pretendido, senioridade, observacoes, fonte)
    VALUES (_company, trim(_nome), _mail, nullif(trim(_telefone),''), nullif(trim(_cargo),''), nullif(_senioridade,''), nullif(trim(_observacoes),''), 'rh')
    RETURNING id INTO _id;
  ELSE
    _existed := true;
    UPDATE public.candidatos SET
      telefone = coalesce(nullif(trim(_telefone),''), telefone),
      cargo_pretendido = coalesce(nullif(trim(_cargo),''), cargo_pretendido),
      senioridade = coalesce(nullif(_senioridade,''), senioridade),
      observacoes = coalesce(nullif(trim(_observacoes),''), observacoes)
    WHERE id = _id;
  END IF;

  FOREACH _v IN ARRAY coalesce(_vaga_ids, '{}') LOOP
    IF EXISTS (SELECT 1 FROM public.vagas WHERE id = _v AND root_company_id = _company) THEN
      INSERT INTO public.candidaturas (root_company_id, candidato_id, vaga_id) VALUES (_company, _id, _v)
      ON CONFLICT (candidato_id, vaga_id) DO NOTHING;
      IF FOUND THEN _novas := _novas + 1; END IF;
    END IF;
  END LOOP;
  RETURN jsonb_build_object('id', _id, 'existed', _existed, 'candidaturas', _novas);
END $$;
REVOKE ALL ON FUNCTION public.talent_upsert_candidato(text,text,text,text,text,text,uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.talent_upsert_candidato(text,text,text,text,text,text,uuid[]) TO authenticated;

-- ===== storage: currículos =====
CREATE POLICY "Curriculos: RH da empresa le" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'curriculos' AND (
  ((storage.foldername(name))[1] = public.get_user_company_id()::text AND public.has_module('talent')
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_manager')))
  OR public.has_role(auth.uid(),'super_admin')));
CREATE POLICY "Curriculos: RH da empresa envia" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'curriculos' AND (storage.foldername(name))[1] = public.get_user_company_id()::text
  AND public.has_module('talent') AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_manager')));
CREATE POLICY "Curriculos: RH da empresa substitui" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'curriculos' AND (storage.foldername(name))[1] = public.get_user_company_id()::text
  AND public.has_module('talent') AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_manager')));