CREATE OR REPLACE FUNCTION public.nr1_pode_gerir(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _company_id IS NOT NULL
    AND auth.uid() IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'super_admin'::public.app_role)
      OR public.consultor_dono_ativo(_company_id)
      OR (
        _company_id = public.get_user_company_id()
        AND public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'hr_manager'::public.app_role])
        AND public.has_module('nr1')
      )
    )
$$;

REVOKE ALL ON FUNCTION public.nr1_pode_gerir(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nr1_pode_gerir(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.nr1_calc_risco(score numeric)
RETURNS public.nr1_nivel_risco
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN score IS NULL THEN NULL
    WHEN score <= 40 THEN 'baixo'::public.nr1_nivel_risco
    WHEN score <= 60 THEN 'moderado'::public.nr1_nivel_risco
    WHEN score <= 80 THEN 'alto'::public.nr1_nivel_risco
    ELSE 'critico'::public.nr1_nivel_risco
  END
$$;

CREATE TABLE public.nr1_convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id uuid NOT NULL REFERENCES public.nr1_diagnosticos(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nr1_convites TO authenticated;
GRANT ALL ON public.nr1_convites TO service_role;
ALTER TABLE public.nr1_convites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nr1_convites_manage" ON public.nr1_convites
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.nr1_diagnosticos d
    WHERE d.id = diagnostico_id AND public.nr1_pode_gerir(d.company_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.nr1_diagnosticos d
    WHERE d.id = diagnostico_id AND public.nr1_pode_gerir(d.company_id)
  )
);

CREATE TRIGGER trg_nr1_convites_updated_at
BEFORE UPDATE ON public.nr1_convites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.nr1_convite_resolver(p_token text)
RETURNS TABLE(ciclo_nome text, expires_at timestamptz, disponivel boolean, questoes jsonb)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_convite public.nr1_convites%ROWTYPE;
  v_ciclo text;
BEGIN
  SELECT c.* INTO v_convite
  FROM public.nr1_convites c
  JOIN public.nr1_diagnosticos d ON d.id = c.diagnostico_id
  WHERE c.token = p_token AND d.status = 'em_andamento';

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::text, NULL::timestamptz, false, '[]'::jsonb;
    RETURN;
  END IF;

  SELECT d.ciclo_nome INTO v_ciclo
  FROM public.nr1_diagnosticos d
  WHERE d.id = v_convite.diagnostico_id;

  RETURN QUERY
  SELECT v_ciclo, v_convite.expires_at,
    (v_convite.used_at IS NULL AND v_convite.expires_at > now()),
    CASE WHEN v_convite.used_at IS NULL AND v_convite.expires_at > now() THEN
      (SELECT jsonb_agg(jsonb_build_object('id', q.id, 'codigo', q.codigo, 'dimensao', q.dimensao, 'enunciado', q.enunciado, 'ordem', q.ordem) ORDER BY q.ordem)
       FROM public.nr1_questoes q WHERE q.ativo)
    ELSE '[]'::jsonb END;
END
$$;

REVOKE ALL ON FUNCTION public.nr1_convite_resolver(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nr1_convite_resolver(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.nr1_submeter_respostas(p_token text, p_respostas jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_convite public.nr1_convites%ROWTYPE;
  v_total_questoes integer;
  v_total_respostas integer;
  v_hash text;
BEGIN
  SELECT * INTO v_convite
  FROM public.nr1_convites
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND OR v_convite.used_at IS NOT NULL OR v_convite.expires_at <= now() THEN
    RAISE EXCEPTION 'Convite inválido, expirado ou já utilizado';
  END IF;

  IF jsonb_typeof(p_respostas) <> 'object' THEN
    RAISE EXCEPTION 'Formato de respostas inválido';
  END IF;

  SELECT count(*) INTO v_total_questoes FROM public.nr1_questoes WHERE ativo;
  SELECT count(*) INTO v_total_respostas
  FROM jsonb_each_text(p_respostas) r
  JOIN public.nr1_questoes q ON q.id::text = r.key AND q.ativo
  WHERE r.value ~ '^[0-4]$';

  IF v_total_respostas <> v_total_questoes OR jsonb_object_length(p_respostas) <> v_total_questoes THEN
    RAISE EXCEPTION 'Todas as questões devem ser respondidas';
  END IF;

  v_hash := encode(digest(v_convite.id::text || ':' || v_convite.token, 'sha256'), 'hex');

  INSERT INTO public.nr1_diagnostico_respostas (diagnostico_id, respondent_hash, questao_id, resposta)
  SELECT v_convite.diagnostico_id, v_hash, q.id, (r.value)::integer
  FROM jsonb_each_text(p_respostas) r
  JOIN public.nr1_questoes q ON q.id::text = r.key AND q.ativo;

  UPDATE public.nr1_convites SET used_at = now() WHERE id = v_convite.id;
  PERFORM public.nr1_recompute_scores(v_convite.diagnostico_id);
  RETURN v_convite.diagnostico_id;
END
$$;

REVOKE ALL ON FUNCTION public.nr1_submeter_respostas(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nr1_submeter_respostas(text, jsonb) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.nr1_resultado_agregado(p_diagnostico_id uuid)
RETURNS TABLE(total_respondentes integer, score_geral numeric, nivel_risco public.nr1_nivel_risco, scores_dimensao jsonb, dados_suficientes boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_total integer;
  v_scores jsonb;
  v_geral numeric;
BEGIN
  SELECT company_id INTO v_company FROM public.nr1_diagnosticos WHERE id = p_diagnostico_id;
  IF v_company IS NULL OR NOT public.nr1_pode_gerir(v_company) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT count(DISTINCT respondent_hash) INTO v_total
  FROM public.nr1_diagnostico_respostas WHERE diagnostico_id = p_diagnostico_id;

  IF v_total < 5 THEN
    RETURN QUERY SELECT v_total, NULL::numeric, NULL::public.nr1_nivel_risco, NULL::jsonb, false;
    RETURN;
  END IF;

  SELECT jsonb_object_agg(dim, sc), avg(sc)::numeric(5,2)
  INTO v_scores, v_geral
  FROM (
    SELECT q.dimensao::text dim,
      round(avg(CASE WHEN q.reverso THEN 4-r.resposta ELSE r.resposta END)::numeric * 25, 2) sc
    FROM public.nr1_diagnostico_respostas r
    JOIN public.nr1_questoes q ON q.id = r.questao_id
    WHERE r.diagnostico_id = p_diagnostico_id
    GROUP BY q.dimensao
  ) s;

  RETURN QUERY SELECT v_total, v_geral, public.nr1_calc_risco(v_geral), v_scores, true;
END
$$;

REVOKE ALL ON FUNCTION public.nr1_resultado_agregado(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nr1_resultado_agregado(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "nr1_diag_select" ON public.nr1_diagnosticos;
CREATE POLICY "nr1_diag_select" ON public.nr1_diagnosticos FOR SELECT TO authenticated
USING (public.nr1_pode_gerir(company_id));

DROP POLICY IF EXISTS "nr1_diag_insert" ON public.nr1_diagnosticos;
CREATE POLICY "nr1_diag_insert" ON public.nr1_diagnosticos FOR INSERT TO authenticated
WITH CHECK (public.nr1_pode_gerir(company_id));

DROP POLICY IF EXISTS "nr1_diag_update" ON public.nr1_diagnosticos;
CREATE POLICY "nr1_diag_update" ON public.nr1_diagnosticos FOR UPDATE TO authenticated
USING (public.nr1_pode_gerir(company_id)) WITH CHECK (public.nr1_pode_gerir(company_id));

DROP POLICY IF EXISTS "nr1_diag_delete" ON public.nr1_diagnosticos;
CREATE POLICY "nr1_diag_delete" ON public.nr1_diagnosticos FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR (company_id = public.get_user_company_id() AND public.has_role(auth.uid(), 'admin'::public.app_role) AND public.has_module('nr1')));

DROP POLICY IF EXISTS "nr1_resp_select" ON public.nr1_diagnostico_respostas;
CREATE POLICY "nr1_resp_select" ON public.nr1_diagnostico_respostas FOR SELECT TO authenticated
USING (false);