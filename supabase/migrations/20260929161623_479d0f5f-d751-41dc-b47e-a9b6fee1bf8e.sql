ALTER TABLE public.candidaturas DROP CONSTRAINT IF EXISTS candidaturas_etapa_check;
ALTER TABLE public.candidaturas ADD CONSTRAINT candidaturas_etapa_check
  CHECK (etapa IN ('triagem','entrevista_rh','entrevista_gestor','proposta','contratado','arquivado'));
ALTER TABLE public.candidaturas
  ADD COLUMN IF NOT EXISTS etapa_desde timestamptz,
  ADD COLUMN IF NOT EXISTS motivo_arquivamento text CHECK (motivo_arquivamento IS NULL OR char_length(motivo_arquivamento) <= 500),
  ADD COLUMN IF NOT EXISTS entrevista_em timestamptz,
  ADD COLUMN IF NOT EXISTS analise_talent jsonb,
  ADD COLUMN IF NOT EXISTS analise_em timestamptz;

CREATE TABLE public.candidato_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  root_company_id uuid NOT NULL,
  candidatura_id uuid NOT NULL REFERENCES public.candidaturas(id) ON DELETE CASCADE,
  candidato_id uuid NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
  etapa_anterior text,
  etapa_nova text NOT NULL,
  motivo text CHECK (motivo IS NULL OR char_length(motivo) <= 500),
  origem text NOT NULL CHECK (origem IN ('agente','manual')),
  criado_por uuid DEFAULT auth.uid(),
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX candidato_historico_cand_idx ON public.candidato_historico(candidatura_id, criado_em);
GRANT SELECT ON public.candidato_historico TO authenticated;
GRANT ALL ON public.candidato_historico TO service_role;
ALTER TABLE public.candidato_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Historico: RH da empresa le" ON public.candidato_historico FOR SELECT TO authenticated
USING ((root_company_id = public.get_user_company_id() AND public.has_module('talent')
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_manager'))) OR public.has_role(auth.uid(),'super_admin'));

CREATE OR REPLACE FUNCTION public.talent_mover_candidatura(
  _id uuid, _etapa text, _motivo text DEFAULT NULL, _origem text DEFAULT 'manual', _entrevista_em timestamptz DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.candidaturas%ROWTYPE; _m text := nullif(trim(coalesce(_motivo,'')),''); _entrev boolean;
BEGIN
  SELECT * INTO c FROM public.candidaturas WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Candidatura não encontrada'; END IF;
  IF NOT (public.has_role(auth.uid(),'super_admin') OR (c.root_company_id = public.get_user_company_id()
     AND public.has_module('talent') AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_manager')))) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  IF _etapa NOT IN ('triagem','entrevista_rh','entrevista_gestor','proposta','contratado','arquivado') THEN RAISE EXCEPTION 'Etapa inválida'; END IF;
  IF _origem NOT IN ('agente','manual') THEN RAISE EXCEPTION 'Origem inválida'; END IF;
  IF _etapa = 'arquivado' AND _m IS NULL THEN RAISE EXCEPTION 'Informe o motivo do arquivamento'; END IF;
  _entrev := _etapa IN ('entrevista_rh','entrevista_gestor');

  IF _etapa = c.etapa THEN
    IF _entrev AND _entrevista_em IS NOT NULL THEN
      UPDATE public.candidaturas SET entrevista_em = _entrevista_em WHERE id = _id;
      INSERT INTO public.candidato_historico (root_company_id, candidatura_id, candidato_id, etapa_anterior, etapa_nova, motivo, origem)
      VALUES (c.root_company_id, _id, c.candidato_id, c.etapa, _etapa,
        'Entrevista agendada para ' || to_char(_entrevista_em AT TIME ZONE 'America/Sao_Paulo','DD/MM/YYYY HH24:MI') || coalesce(' — ' || _m, ''), _origem);
      RETURN jsonb_build_object('ok', true, 'agendamento', true);
    END IF;
    RAISE EXCEPTION 'Candidato já está nesta etapa';
  END IF;

  UPDATE public.candidaturas SET
    etapa = _etapa, etapa_desde = now(),
    entrevista_em = CASE WHEN _entrev THEN _entrevista_em ELSE NULL END,
    motivo_arquivamento = CASE WHEN _etapa = 'arquivado' THEN _m ELSE NULL END,
    status = CASE WHEN _etapa = 'arquivado' THEN 'reprovada' WHEN _etapa = 'contratado' THEN 'contratada' ELSE 'ativa' END
  WHERE id = _id;
  INSERT INTO public.candidato_historico (root_company_id, candidatura_id, candidato_id, etapa_anterior, etapa_nova, motivo, origem)
  VALUES (c.root_company_id, _id, c.candidato_id, c.etapa, _etapa,
    concat_ws(' — ', _m, CASE WHEN _entrev AND _entrevista_em IS NOT NULL THEN 'Entrevista agendada para ' || to_char(_entrevista_em AT TIME ZONE 'America/Sao_Paulo','DD/MM/YYYY HH24:MI') END), _origem);
  RETURN jsonb_build_object('ok', true);
END $$;
REVOKE ALL ON FUNCTION public.talent_mover_candidatura(uuid,text,text,text,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.talent_mover_candidatura(uuid,text,text,text,timestamptz) TO authenticated;