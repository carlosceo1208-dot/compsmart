CREATE OR REPLACE FUNCTION public.capture_ebook_lead(_nome text, _email text, _origem text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(coalesce(_email,'')));
  v_nome text := trim(coalesce(_nome,''));
  v_origem text := trim(coalesce(_origem,''));
BEGIN
  IF length(v_nome) < 1 OR length(v_nome) > 100 THEN RAISE EXCEPTION 'invalid'; END IF;
  IF length(v_email) > 255 OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'invalid'; END IF;
  IF v_origem <> 'materiais-ebook-remuneracao' THEN RAISE EXCEPTION 'invalid'; END IF;
  IF EXISTS (SELECT 1 FROM public.leads WHERE lower(trim(email)) = v_email) THEN
    RETURN true;
  END IF;
  INSERT INTO public.leads (nome, email, origem, lead_magnet, consentimento_lgpd)
  VALUES (v_nome, v_email, v_origem, 'remuneracao', true);
  RETURN false;
END;
$$;
REVOKE ALL ON FUNCTION public.capture_ebook_lead(text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.capture_ebook_lead(text,text,text) TO anon, authenticated;