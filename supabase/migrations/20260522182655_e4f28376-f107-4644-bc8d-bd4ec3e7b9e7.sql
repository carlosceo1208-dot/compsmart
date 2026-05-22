
CREATE TABLE public.clima_externo_respostas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pesquisa_id UUID NOT NULL REFERENCES public.clima_pesquisas(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  tipo_stakeholder TEXT NOT NULL CHECK (tipo_stakeholder IN ('cliente','fornecedor','parceiro','candidato','ex_colaborador','outro')),
  setor TEXT,
  tempo_relacionamento TEXT,
  scores_dimensao JSONB NOT NULL DEFAULT '{}'::jsonb,
  score_geral NUMERIC(3,2),
  nps INTEGER,
  comentario_pontos_fortes TEXT,
  comentario_pontos_melhoria TEXT,
  fingerprint TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clima_externo_respostas_pesquisa ON public.clima_externo_respostas(pesquisa_id);
CREATE INDEX idx_clima_externo_respostas_company ON public.clima_externo_respostas(company_id);

ALTER TABLE public.clima_externo_respostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY clima_externo_select
ON public.clima_externo_respostas FOR SELECT
USING (
  (company_id = public.get_user_company_id())
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role])
);

CREATE OR REPLACE FUNCTION public.submit_clima_externo_resposta(
  p_token TEXT,
  p_tipo_stakeholder TEXT,
  p_setor TEXT,
  p_tempo_relacionamento TEXT,
  p_scores_dimensao JSONB,
  p_score_geral NUMERIC,
  p_nps INTEGER,
  p_pontos_fortes TEXT,
  p_pontos_melhoria TEXT,
  p_fingerprint TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pesquisa RECORD;
  v_id UUID;
BEGIN
  SELECT id, company_id, status
  INTO v_pesquisa
  FROM public.clima_pesquisas
  WHERE public_token::TEXT = p_token;

  IF v_pesquisa.id IS NULL THEN
    RAISE EXCEPTION 'Pesquisa não encontrada';
  END IF;
  IF v_pesquisa.status::TEXT <> 'aberta' THEN
    RAISE EXCEPTION 'Pesquisa não está aberta';
  END IF;

  INSERT INTO public.clima_externo_respostas (
    pesquisa_id, company_id, tipo_stakeholder, setor, tempo_relacionamento,
    scores_dimensao, score_geral, nps, comentario_pontos_fortes, comentario_pontos_melhoria, fingerprint
  ) VALUES (
    v_pesquisa.id, v_pesquisa.company_id, p_tipo_stakeholder, p_setor, p_tempo_relacionamento,
    p_scores_dimensao, p_score_geral, p_nps, p_pontos_fortes, p_pontos_melhoria, p_fingerprint
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_clima_externo_resposta(TEXT,TEXT,TEXT,TEXT,JSONB,NUMERIC,INTEGER,TEXT,TEXT,TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_clima_externo_publico(p_token TEXT)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  status TEXT,
  modalidade TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT cp.id, cp.nome, cp.status::TEXT, cp.modalidade::TEXT
  FROM public.clima_pesquisas cp
  WHERE cp.public_token::TEXT = p_token AND cp.status::TEXT = 'aberta';
$$;

GRANT EXECUTE ON FUNCTION public.get_clima_externo_publico(TEXT) TO anon, authenticated;
