CREATE TABLE public.maturidade_questionario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero int NOT NULL UNIQUE CHECK (numero BETWEEN 1 AND 48),
  eixo int NOT NULL CHECK (eixo BETWEEN 1 AND 4),
  dimensao int NOT NULL CHECK (dimensao BETWEEN 1 AND 12),
  afirmacao text NOT NULL,
  grupo_aplicavel text NOT NULL CHECK (grupo_aplicavel IN ('rh','gestores','ambos'))
);
GRANT SELECT ON public.maturidade_questionario TO authenticated;
GRANT ALL ON public.maturidade_questionario TO service_role;
ALTER TABLE public.maturidade_questionario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maturidade_q_internos" ON public.maturidade_questionario FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'consultor'));

CREATE OR REPLACE FUNCTION public.maturidade_pode_gerir(_company uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _company IS NOT NULL AND (
    public.is_super_admin(auth.uid())
    OR (public.has_role(auth.uid(),'consultor') AND EXISTS (
      SELECT 1 FROM public.rh_service_projetos p
      WHERE p.tenant_id = _company AND p.status = 'em_andamento' AND p.consultor_id IS NOT NULL))
  )
$$;
GRANT EXECUTE ON FUNCTION public.maturidade_pode_gerir(uuid) TO authenticated;

CREATE TABLE public.maturidade_diagnosticos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  root_company_id uuid NOT NULL,
  nome_projeto text NOT NULL CHECK (char_length(nome_projeto) BETWEEN 3 AND 160),
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','coletando','concluido')),
  responsavel_id uuid NOT NULL DEFAULT auth.uid(),
  criado_em timestamptz NOT NULL DEFAULT now(),
  concluido_em timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maturidade_diagnosticos TO authenticated;
GRANT ALL ON public.maturidade_diagnosticos TO service_role;
ALTER TABLE public.maturidade_diagnosticos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maturidade_diag_gerir" ON public.maturidade_diagnosticos FOR ALL TO authenticated
  USING (public.maturidade_pode_gerir(root_company_id)) WITH CHECK (public.maturidade_pode_gerir(root_company_id));

CREATE TABLE public.maturidade_gestores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id uuid NOT NULL REFERENCES public.maturidade_diagnosticos(id) ON DELETE CASCADE,
  ordem int NOT NULL,
  completo boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (diagnostico_id, ordem)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maturidade_gestores TO authenticated;
GRANT ALL ON public.maturidade_gestores TO service_role;
ALTER TABLE public.maturidade_gestores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maturidade_gest_gerir" ON public.maturidade_gestores FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.maturidade_diagnosticos d WHERE d.id = diagnostico_id AND public.maturidade_pode_gerir(d.root_company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.maturidade_diagnosticos d WHERE d.id = diagnostico_id AND public.maturidade_pode_gerir(d.root_company_id)));

CREATE TABLE public.maturidade_convidados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id uuid NOT NULL REFERENCES public.maturidade_diagnosticos(id) ON DELETE CASCADE,
  email text NOT NULL CHECK (char_length(email) <= 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(24),'hex'),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','respondido')),
  expira_em timestamptz NOT NULL DEFAULT now() + interval '30 days',
  respondido_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maturidade_convidados TO authenticated;
GRANT ALL ON public.maturidade_convidados TO service_role;
ALTER TABLE public.maturidade_convidados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maturidade_conv_gerir" ON public.maturidade_convidados FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.maturidade_diagnosticos d WHERE d.id = diagnostico_id AND public.maturidade_pode_gerir(d.root_company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.maturidade_diagnosticos d WHERE d.id = diagnostico_id AND public.maturidade_pode_gerir(d.root_company_id)));

CREATE TABLE public.maturidade_respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id uuid NOT NULL REFERENCES public.maturidade_diagnosticos(id) ON DELETE CASCADE,
  respondente_tipo text NOT NULL CHECK (respondente_tipo IN ('rh','gestor')),
  convidado_id uuid REFERENCES public.maturidade_convidados(id) ON DELETE CASCADE,
  gestor_id uuid REFERENCES public.maturidade_gestores(id) ON DELETE CASCADE,
  questionario_id uuid NOT NULL REFERENCES public.maturidade_questionario(id),
  resposta int NOT NULL CHECK (resposta BETWEEN 1 AND 5),
  criado_em timestamptz NOT NULL DEFAULT now(),
  CHECK ((respondente_tipo='rh' AND convidado_id IS NOT NULL AND gestor_id IS NULL) OR (respondente_tipo='gestor' AND gestor_id IS NOT NULL AND convidado_id IS NULL))
);
CREATE UNIQUE INDEX maturidade_resp_rh_uq ON public.maturidade_respostas(convidado_id, questionario_id) WHERE convidado_id IS NOT NULL;
CREATE UNIQUE INDEX maturidade_resp_g_uq ON public.maturidade_respostas(gestor_id, questionario_id) WHERE gestor_id IS NOT NULL;
GRANT ALL ON public.maturidade_respostas TO service_role;
ALTER TABLE public.maturidade_respostas ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.maturidade_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL, empresa text NOT NULL, email text NOT NULL, porte text NOT NULL,
  nivel_teaser text NOT NULL, score_teaser numeric(3,2),
  consentimento_lgpd boolean NOT NULL CHECK (consentimento_lgpd),
  consentimento_em timestamptz NOT NULL DEFAULT now(),
  consentimento_versao text NOT NULL,
  ip_hash text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.maturidade_leads TO authenticated;
GRANT ALL ON public.maturidade_leads TO service_role;
ALTER TABLE public.maturidade_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maturidade_leads_super_admin" ON public.maturidade_leads FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE TABLE public.maturidade_tentativas (
  id bigserial PRIMARY KEY, chave text NOT NULL, criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.maturidade_tentativas(chave, criado_em);
GRANT ALL ON public.maturidade_tentativas TO service_role;
ALTER TABLE public.maturidade_tentativas ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.maturidade_ip_hash()
RETURNS text LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT md5(coalesce(split_part(coalesce(nullif(current_setting('request.headers', true),'')::json->>'x-forwarded-for','sem-ip'),',',1),'sem-ip'))
$$;

CREATE OR REPLACE FUNCTION public.maturidade_excedeu(_chave text, _max int, _janela interval)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  DELETE FROM public.maturidade_tentativas WHERE criado_em < now() - interval '1 day';
  SELECT count(*) INTO n FROM public.maturidade_tentativas WHERE chave = _chave AND criado_em > now() - _janela;
  IF n >= _max THEN RETURN true; END IF;
  INSERT INTO public.maturidade_tentativas(chave) VALUES (_chave);
  RETURN false;
END $$;
REVOKE ALL ON FUNCTION public.maturidade_excedeu(text,int,interval) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_maturidade_lead(p_nome text, p_empresa text, p_email text, p_porte text, p_nivel text, p_score numeric, p_consentimento boolean, p_versao text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ip text := public.maturidade_ip_hash();
BEGIN
  IF p_consentimento IS DISTINCT FROM true THEN RAISE EXCEPTION 'consentimento_obrigatorio'; END IF;
  IF char_length(trim(coalesce(p_nome,''))) NOT BETWEEN 2 AND 120
     OR char_length(trim(coalesce(p_empresa,''))) NOT BETWEEN 2 AND 160
     OR char_length(coalesce(p_email,'')) > 255 OR p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
     OR p_porte NOT IN ('pequena','media','grande')
     OR p_nivel NOT IN ('Reativo','Estruturado','Alinhado','Parceiro','Transformacional')
     OR p_score IS NULL OR p_score < 1 OR p_score > 5
     OR char_length(coalesce(p_versao,'')) NOT BETWEEN 1 AND 40 THEN
    RAISE EXCEPTION 'dados_invalidos';
  END IF;
  IF public.maturidade_excedeu('lead:'||ip, 5, interval '1 hour') THEN RAISE EXCEPTION 'muitas_tentativas'; END IF;
  INSERT INTO public.maturidade_leads(nome,empresa,email,porte,nivel_teaser,score_teaser,consentimento_lgpd,consentimento_versao,ip_hash)
  VALUES (trim(p_nome),trim(p_empresa),lower(trim(p_email)),p_porte,p_nivel,round(p_score,2),true,p_versao,ip);
END $$;
GRANT EXECUTE ON FUNCTION public.submit_maturidade_lead(text,text,text,text,text,numeric,boolean,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.maturidade_convite_resolver(p_token text)
RETURNS public.maturidade_convidados LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.maturidade_convidados; ip text := public.maturidade_ip_hash();
BEGIN
  IF public.maturidade_excedeu('tok-ip:'||ip, 30, interval '1 hour')
     OR public.maturidade_excedeu('tok:'||left(coalesce(p_token,''),64), 20, interval '1 hour') THEN
    RAISE EXCEPTION 'muitas_tentativas';
  END IF;
  IF p_token IS NULL OR p_token !~ '^[0-9a-f]{48}$' THEN RAISE EXCEPTION 'convite_invalido'; END IF;
  SELECT * INTO c FROM public.maturidade_convidados WHERE token = p_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'convite_invalido'; END IF;
  IF c.expira_em < now() THEN RAISE EXCEPTION 'convite_expirado'; END IF;
  IF c.status = 'respondido' THEN RAISE EXCEPTION 'convite_respondido'; END IF;
  IF (SELECT status FROM public.maturidade_diagnosticos WHERE id = c.diagnostico_id) = 'concluido' THEN RAISE EXCEPTION 'convite_encerrado'; END IF;
  RETURN c;
END $$;
REVOKE ALL ON FUNCTION public.maturidade_convite_resolver(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.maturidade_convite_questoes(p_token text)
RETURNS TABLE(id uuid, numero int, dimensao int, afirmacao text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.maturidade_convite_resolver(p_token);
  RETURN QUERY SELECT q.id, q.numero, q.dimensao, q.afirmacao FROM public.maturidade_questionario q
    WHERE q.grupo_aplicavel IN ('rh','ambos') ORDER BY q.numero;
END $$;
GRANT EXECUTE ON FUNCTION public.maturidade_convite_questoes(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.maturidade_convite_responder(p_token text, p_respostas jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.maturidade_convidados; esperado int; recebido int;
BEGIN
  c := public.maturidade_convite_resolver(p_token);
  IF jsonb_typeof(p_respostas) <> 'object' THEN RAISE EXCEPTION 'dados_invalidos'; END IF;
  SELECT count(*) INTO esperado FROM public.maturidade_questionario WHERE grupo_aplicavel IN ('rh','ambos');
  SELECT count(*) INTO recebido FROM jsonb_each_text(p_respostas) e
    JOIN public.maturidade_questionario q ON q.id::text = e.key AND q.grupo_aplicavel IN ('rh','ambos')
    WHERE e.value ~ '^[1-5]$';
  IF recebido <> esperado OR (SELECT count(*) FROM jsonb_object_keys(p_respostas)) <> esperado THEN RAISE EXCEPTION 'respostas_incompletas'; END IF;
  INSERT INTO public.maturidade_respostas(diagnostico_id,respondente_tipo,convidado_id,questionario_id,resposta)
    SELECT c.diagnostico_id,'rh',c.id,e.key::uuid,e.value::int FROM jsonb_each_text(p_respostas) e;
  UPDATE public.maturidade_convidados SET status='respondido', respondido_em=now() WHERE id=c.id;
  UPDATE public.maturidade_diagnosticos SET status='coletando' WHERE id=c.diagnostico_id AND status='rascunho';
END $$;
GRANT EXECUTE ON FUNCTION public.maturidade_convite_responder(text,jsonb) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.maturidade_questoes_gestor(p_diagnostico uuid)
RETURNS TABLE(id uuid, numero int, dimensao int, afirmacao text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.maturidade_diagnosticos d WHERE d.id=p_diagnostico AND public.maturidade_pode_gerir(d.root_company_id)) THEN
    RAISE EXCEPTION 'sem_permissao'; END IF;
  RETURN QUERY SELECT q.id,q.numero,q.dimensao,q.afirmacao FROM public.maturidade_questionario q
    WHERE q.grupo_aplicavel IN ('gestores','ambos') ORDER BY q.numero;
END $$;
GRANT EXECUTE ON FUNCTION public.maturidade_questoes_gestor(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.maturidade_registrar_gestor(p_diagnostico uuid, p_respostas jsonb)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.maturidade_diagnosticos; esperado int; recebido int; g uuid; n int;
BEGIN
  SELECT * INTO d FROM public.maturidade_diagnosticos WHERE id=p_diagnostico;
  IF NOT FOUND OR NOT public.maturidade_pode_gerir(d.root_company_id) THEN RAISE EXCEPTION 'sem_permissao'; END IF;
  IF d.status='concluido' THEN RAISE EXCEPTION 'diagnostico_concluido'; END IF;
  IF jsonb_typeof(p_respostas) <> 'object' THEN RAISE EXCEPTION 'dados_invalidos'; END IF;
  SELECT count(*) INTO esperado FROM public.maturidade_questionario WHERE grupo_aplicavel IN ('gestores','ambos');
  SELECT count(*) INTO recebido FROM jsonb_each_text(p_respostas) e
    JOIN public.maturidade_questionario q ON q.id::text=e.key AND q.grupo_aplicavel IN ('gestores','ambos')
    WHERE e.value ~ '^[1-5]$';
  IF recebido <> esperado OR (SELECT count(*) FROM jsonb_object_keys(p_respostas)) <> esperado THEN RAISE EXCEPTION 'respostas_incompletas'; END IF;
  SELECT coalesce(max(ordem),0)+1 INTO n FROM public.maturidade_gestores WHERE diagnostico_id=p_diagnostico;
  INSERT INTO public.maturidade_gestores(diagnostico_id,ordem,completo) VALUES (p_diagnostico,n,true) RETURNING id INTO g;
  INSERT INTO public.maturidade_respostas(diagnostico_id,respondente_tipo,gestor_id,questionario_id,resposta)
    SELECT p_diagnostico,'gestor',g,e.key::uuid,e.value::int FROM jsonb_each_text(p_respostas) e;
  UPDATE public.maturidade_diagnosticos SET status='coletando' WHERE id=p_diagnostico AND status='rascunho';
  RETURN n;
END $$;
GRANT EXECUTE ON FUNCTION public.maturidade_registrar_gestor(uuid,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.maturidade_scorecard(p_diagnostico uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.maturidade_diagnosticos;
BEGIN
  SELECT * INTO d FROM public.maturidade_diagnosticos WHERE id=p_diagnostico;
  IF NOT FOUND OR NOT public.maturidade_pode_gerir(d.root_company_id) THEN RAISE EXCEPTION 'sem_permissao'; END IF;
  RETURN jsonb_build_object(
    'rh_convidados', (SELECT count(*) FROM public.maturidade_convidados WHERE diagnostico_id=p_diagnostico),
    'rh_respondidos', (SELECT count(*) FROM public.maturidade_convidados WHERE diagnostico_id=p_diagnostico AND status='respondido'),
    'gestores_completos', (SELECT count(*) FROM public.maturidade_gestores WHERE diagnostico_id=p_diagnostico AND completo),
    'dimensoes', coalesce((SELECT jsonb_agg(jsonb_build_object('dimensao',x.dimensao,'grupo',x.grupo,'media',x.media) ORDER BY x.dimensao) FROM (
       SELECT q.dimensao, r.respondente_tipo AS grupo, round(avg(r.resposta)::numeric,4) AS media
       FROM public.maturidade_respostas r JOIN public.maturidade_questionario q ON q.id=r.questionario_id
       WHERE r.diagnostico_id=p_diagnostico GROUP BY q.dimensao, r.respondente_tipo) x), '[]'::jsonb)
  );
END $$;
GRANT EXECUTE ON FUNCTION public.maturidade_scorecard(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.maturidade_empresas()
RETURNS TABLE(id uuid, nome text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, coalesce(o.fantasy_name, o.name) FROM public.organizational_structure o
  WHERE o.type='company' AND public.maturidade_pode_gerir(o.id) ORDER BY 2
$$;
GRANT EXECUTE ON FUNCTION public.maturidade_empresas() TO authenticated;