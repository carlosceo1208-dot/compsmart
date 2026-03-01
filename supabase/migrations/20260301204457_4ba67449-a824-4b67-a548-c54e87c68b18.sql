
-- Add explicit auth + company isolation checks to get_org_breadcrumb
CREATE OR REPLACE FUNCTION public.get_org_breadcrumb(entity_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  breadcrumb TEXT := '';
  current_id uuid := entity_id;
  current_code TEXT;
  current_parent uuid;
  v_user_company_id UUID;
  v_entity_company_id UUID;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate input
  IF entity_id IS NULL THEN
    RETURN '';
  END IF;

  -- Get caller's company
  SELECT root_company_id INTO v_user_company_id
  FROM profiles WHERE id = auth.uid();

  IF v_user_company_id IS NULL THEN
    RAISE EXCEPTION 'User not associated with company';
  END IF;

  -- Verify entity belongs to caller's company
  SELECT root_company_id INTO v_entity_company_id
  FROM organizational_structure WHERE id = entity_id;

  IF v_entity_company_id IS NULL OR v_entity_company_id != v_user_company_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Percorrer hierarquia de baixo para cima
  WHILE current_id IS NOT NULL LOOP
    SELECT code, parent_id INTO current_code, current_parent
    FROM organizational_structure
    WHERE id = current_id;
    
    IF current_code IS NOT NULL THEN
      IF breadcrumb = '' THEN
        breadcrumb := current_code;
      ELSE
        breadcrumb := current_code || ' > ' || breadcrumb;
      END IF;
    END IF;
    
    current_id := current_parent;
  END LOOP;
  
  RETURN breadcrumb;
END;
$function$;

-- Add explicit auth + company isolation checks to get_org_breadcrumb_friendly
CREATE OR REPLACE FUNCTION public.get_org_breadcrumb_friendly(entity_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  breadcrumb TEXT := '';
  current_id uuid := entity_id;
  current_description TEXT;
  current_parent uuid;
  v_user_company_id UUID;
  v_entity_company_id UUID;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate input
  IF entity_id IS NULL THEN
    RETURN '';
  END IF;

  -- Get caller's company
  SELECT root_company_id INTO v_user_company_id
  FROM profiles WHERE id = auth.uid();

  IF v_user_company_id IS NULL THEN
    RAISE EXCEPTION 'User not associated with company';
  END IF;

  -- Verify entity belongs to caller's company
  SELECT root_company_id INTO v_entity_company_id
  FROM organizational_structure WHERE id = entity_id;

  IF v_entity_company_id IS NULL OR v_entity_company_id != v_user_company_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Percorrer hierarquia de baixo para cima
  WHILE current_id IS NOT NULL LOOP
    SELECT description, parent_id INTO current_description, current_parent
    FROM organizational_structure
    WHERE id = current_id;
    
    IF current_description IS NOT NULL THEN
      IF breadcrumb = '' THEN
        breadcrumb := current_description;
      ELSE
        breadcrumb := current_description || ' > ' || breadcrumb;
      END IF;
    END IF;
    
    current_id := current_parent;
  END LOOP;
  
  RETURN breadcrumb;
END;
$function$;
