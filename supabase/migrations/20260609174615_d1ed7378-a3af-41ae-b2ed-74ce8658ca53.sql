
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, public', r.sig);
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.get_feedback_request_by_token(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_external_feedback(uuid, jsonb, numeric, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_clima_pesquisa_publica(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_clima_resposta_anonima(uuid, text, text, text, text, text, text, numeric, jsonb, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.get_clima_externo_publico(text) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_clima_externo_resposta(text, text, text, text, jsonb, numeric, integer, text, text, text) TO anon;
