-- 1. Add public token + invite tracking columns
ALTER TABLE public.clima_pesquisas
  ADD COLUMN IF NOT EXISTS public_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS convites_enviados integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_invite_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clima_pesquisas_public_token
  ON public.clima_pesquisas(public_token);

-- 2. RPC for anonymous lookup by token (returns minimal fields)
CREATE OR REPLACE FUNCTION public.get_clima_pesquisa_publica(_token uuid)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  nome text,
  status text,
  modalidade text,
  periodo_inicio date,
  periodo_fim date
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, company_id, nome, status::text, modalidade::text, periodo_inicio, periodo_fim
  FROM public.clima_pesquisas
  WHERE public_token = _token
    AND status = 'aberta'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_clima_pesquisa_publica(uuid) TO anon, authenticated;

-- 3. RPC for anonymous submission
CREATE OR REPLACE FUNCTION public.submit_clima_resposta_anonima(
  _token uuid,
  _respondent_hash text,
  _tipo_respondente text,
  _departamento text,
  _funcao_nivel text,
  _tempo_empresa text,
  _modalidade_trabalho text,
  _score_geral numeric,
  _scores_dimensao jsonb,
  _itens jsonb  -- array of {dimensao, questao_num, valor}
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pesquisa public.clima_pesquisas%ROWTYPE;
  v_resp_id uuid;
  v_total integer;
  v_avg numeric;
  v_dim jsonb;
BEGIN
  -- Validate survey exists and is open
  SELECT * INTO v_pesquisa
  FROM public.clima_pesquisas
  WHERE public_token = _token AND status = 'aberta'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pesquisa não encontrada ou fechada' USING ERRCODE = '22023';
  END IF;

  IF length(_respondent_hash) < 16 THEN
    RAISE EXCEPTION 'Hash do respondente inválido' USING ERRCODE = '22023';
  END IF;

  -- Validate items array
  IF jsonb_typeof(_itens) <> 'array' OR jsonb_array_length(_itens) < 1 THEN
    RAISE EXCEPTION 'Itens de resposta inválidos' USING ERRCODE = '22023';
  END IF;

  -- Insert response (unique constraint on pesquisa_id + respondent_hash prevents duplicates)
  INSERT INTO public.clima_respostas (
    pesquisa_id, company_id, respondent_hash, tipo_respondente,
    departamento, funcao_nivel, tempo_empresa, modalidade_trabalho,
    score_geral, scores_dimensao
  ) VALUES (
    v_pesquisa.id, v_pesquisa.company_id, _respondent_hash, _tipo_respondente::clima_tipo_respondente,
    NULLIF(_departamento,''), NULLIF(_funcao_nivel,''), NULLIF(_tempo_empresa,''), NULLIF(_modalidade_trabalho,''),
    _score_geral, _scores_dimensao
  )
  RETURNING id INTO v_resp_id;

  -- Insert items
  INSERT INTO public.clima_respostas_itens (resposta_id, dimensao, questao_num, valor)
  SELECT v_resp_id,
         (item->>'dimensao')::clima_dimensao,
         (item->>'questao_num')::integer,
         (item->>'valor')::smallint
  FROM jsonb_array_elements(_itens) AS item;

  -- Recalculate aggregates
  SELECT count(*),
         avg(score_geral),
         jsonb_object_agg(dim, avg_score)
  INTO v_total, v_avg, v_dim
  FROM (
    SELECT dim, avg((scores_dimensao->>dim)::numeric) AS avg_score
    FROM public.clima_respostas,
         LATERAL jsonb_object_keys(scores_dimensao) AS dim
    WHERE pesquisa_id = v_pesquisa.id
    GROUP BY dim
  ) agg;

  SELECT count(*), avg(score_geral) INTO v_total, v_avg
  FROM public.clima_respostas WHERE pesquisa_id = v_pesquisa.id;

  UPDATE public.clima_pesquisas
  SET total_respondentes = v_total,
      score_geral = round(v_avg, 2),
      scores_dimensao = v_dim,
      updated_at = now()
  WHERE id = v_pesquisa.id;

  RETURN v_resp_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_clima_resposta_anonima(
  uuid, text, text, text, text, text, text, numeric, jsonb, jsonb
) TO anon, authenticated;

-- 4. RPC for incrementing invite counter (admin/HR only)
CREATE OR REPLACE FUNCTION public.registrar_envio_convites_clima(_pesquisa_id uuid, _quantidade integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr_manager'::app_role)) THEN
    RAISE EXCEPTION 'Sem permissão' USING ERRCODE = '42501';
  END IF;

  UPDATE public.clima_pesquisas
  SET convites_enviados = convites_enviados + GREATEST(_quantidade, 0),
      last_invite_at = now()
  WHERE id = _pesquisa_id
    AND company_id = get_user_company_id();
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_envio_convites_clima(uuid, integer) TO authenticated;