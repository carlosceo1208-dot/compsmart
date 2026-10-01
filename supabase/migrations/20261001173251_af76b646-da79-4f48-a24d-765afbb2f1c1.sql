CREATE OR REPLACE FUNCTION public.nr1_consultor_liberado()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(public.consultor_dono_ativo(public.get_user_company_id()), false)
$$;
REVOKE ALL ON FUNCTION public.nr1_consultor_liberado() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nr1_consultor_liberado() TO authenticated;