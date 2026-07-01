
-- 1. Harden definer functions with explicit auth checks
CREATE OR REPLACE FUNCTION public.get_org_breadcrumb(entity_id uuid)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result TEXT := '';
  v_current_id UUID := entity_id;
  v_code TEXT;
  v_parent_id UUID;
  v_user_company UUID;
  v_entity_company UUID;
  v_iterations INT := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF entity_id IS NULL THEN
    RETURN '';
  END IF;

  SELECT get_user_company_id() INTO v_user_company;
  SELECT COALESCE(root_company_id, id) INTO v_entity_company
    FROM public.organizational_structure WHERE id = entity_id;

  IF v_user_company IS NULL OR v_entity_company IS NULL
     OR (v_entity_company <> v_user_company AND NOT is_super_admin(auth.uid())) THEN
    RETURN '';
  END IF;

  WHILE v_current_id IS NOT NULL AND v_iterations < 20 LOOP
    SELECT code, parent_id INTO v_code, v_parent_id
      FROM public.organizational_structure WHERE id = v_current_id;
    IF v_code IS NULL THEN EXIT; END IF;
    v_result := CASE WHEN v_result = '' THEN v_code ELSE v_code || ' > ' || v_result END;
    v_current_id := v_parent_id;
    v_iterations := v_iterations + 1;
  END LOOP;

  RETURN v_result;
END;
$$;

-- 2. Cleanup function for expired unsubscribe tokens (used by scheduled job)
CREATE OR REPLACE FUNCTION public.cleanup_expired_unsubscribe_tokens()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_deleted INT;
BEGIN
  DELETE FROM public.email_unsubscribe_tokens
   WHERE used_at IS NOT NULL AND used_at < now() - interval '30 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_expired_unsubscribe_tokens() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_unsubscribe_tokens() TO service_role;
