CREATE OR REPLACE FUNCTION public.nr1_areas_empresa(_company uuid)
 RETURNS SETOF text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH RECURSIVE t AS (
    SELECT id, name FROM public.organizational_structure WHERE parent_id = _company
    UNION ALL
    SELECT o.id, o.name FROM public.organizational_structure o JOIN t ON o.parent_id = t.id
  ) SELECT DISTINCT name FROM t WHERE name IS NOT NULL ORDER BY 1
$$;
REVOKE ALL ON FUNCTION public.nr1_areas_empresa(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nr1_areas_empresa(uuid) TO service_role;

DO $do$
DECLARE src text;
BEGIN
  SELECT pg_get_functiondef('public.nr1_submeter_completo(text,uuid,jsonb,jsonb,jsonb,jsonb)'::regprocedure) INTO src;
  src := replace(src,
    'SELECT 1 FROM public.organizational_structure o
      WHERE (o.root_company_id = v_company OR o.parent_id = v_company) AND o.id <> v_company AND o.name = v_area',
    'SELECT 1 FROM public.nr1_areas_empresa(v_company) a WHERE a = v_area');
  IF position('nr1_areas_empresa' in src) = 0 THEN RAISE EXCEPTION 'replace falhou'; END IF;
  EXECUTE src;
END $do$;