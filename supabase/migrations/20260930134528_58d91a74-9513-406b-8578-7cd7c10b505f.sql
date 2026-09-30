ALTER TABLE public.nr1_convites ADD COLUMN grupo text;
UPDATE public.nr1_convites SET grupo = 'Geral' WHERE grupo IS NULL;
ALTER TABLE public.nr1_convites ALTER COLUMN grupo SET NOT NULL;

DROP FUNCTION IF EXISTS public.nr1_convite_resolver(text);
CREATE FUNCTION public.nr1_convite_resolver(p_token text)
RETURNS TABLE(ciclo_nome text, grupo text, expires_at timestamptz, disponivel boolean, questoes jsonb)
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
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::timestamptz, false, '[]'::jsonb;
    RETURN;
  END IF;

  SELECT d.ciclo_nome INTO v_ciclo FROM public.nr1_diagnosticos d WHERE d.id = v_convite.diagnostico_id;
  RETURN QUERY SELECT v_ciclo, v_convite.grupo, v_convite.expires_at,
    (v_convite.expires_at > now()),
    CASE WHEN v_convite.expires_at > now() THEN
      (SELECT jsonb_agg(jsonb_build_object('id', q.id, 'codigo', q.codigo, 'dimensao', q.dimensao, 'enunciado', q.enunciado, 'ordem', q.ordem) ORDER BY q.ordem)
       FROM public.nr1_questoes q WHERE q.ativo)
    ELSE '[]'::jsonb END;
END
$$;
REVOKE ALL ON FUNCTION public.nr1_convite_resolver(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nr1_convite_resolver(text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.nr1_submeter_respostas(text, jsonb) FROM PUBLIC, anon, authenticated;
DROP FUNCTION public.nr1_submeter_respostas(text, jsonb);
CREATE FUNCTION public.nr1_submeter_respostas(p_token text, p_submission_id uuid, p_respostas jsonb)
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
  SELECT * INTO v_convite FROM public.nr1_convites WHERE token = p_token FOR SHARE;
  IF NOT FOUND OR v_convite.expires_at <= now() THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;
  IF p_submission_id IS NULL OR jsonb_typeof(p_respostas) <> 'object' THEN
    RAISE EXCEPTION 'Envio inválido';
  END IF;

  SELECT count(*) INTO v_total_questoes FROM public.nr1_questoes WHERE ativo;
  SELECT count(*) INTO v_total_respostas
  FROM jsonb_each_text(p_respostas) r
  JOIN public.nr1_questoes q ON q.id::text = r.key AND q.ativo
  WHERE r.value ~ '^[0-4]$';
  IF v_total_respostas <> v_total_questoes OR jsonb_object_length(p_respostas) <> v_total_questoes THEN
    RAISE EXCEPTION 'Todas as questões devem ser respondidas';
  END IF;

  v_hash := encode(digest(v_convite.id::text || ':' || p_submission_id::text, 'sha256'), 'hex');
  IF EXISTS (SELECT 1 FROM public.nr1_diagnostico_respostas WHERE diagnostico_id=v_convite.diagnostico_id AND respondent_hash=v_hash) THEN
    RAISE EXCEPTION 'Este questionário já foi enviado';
  END IF;

  INSERT INTO public.nr1_diagnostico_respostas (diagnostico_id, respondent_hash, questao_id, resposta)
  SELECT v_convite.diagnostico_id, v_hash, q.id, (r.value)::integer
  FROM jsonb_each_text(p_respostas) r
  JOIN public.nr1_questoes q ON q.id::text = r.key AND q.ativo;

  UPDATE public.nr1_convites SET used_at = COALESCE(used_at, now()) WHERE id = v_convite.id;
  PERFORM public.nr1_recompute_scores(v_convite.diagnostico_id);
  RETURN v_convite.diagnostico_id;
END
$$;
REVOKE ALL ON FUNCTION public.nr1_submeter_respostas(text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nr1_submeter_respostas(text, uuid, jsonb) TO anon, authenticated, service_role;