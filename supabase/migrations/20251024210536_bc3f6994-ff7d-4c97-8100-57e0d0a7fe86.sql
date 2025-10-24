-- Criar função que retorna breadcrumb amigável com descrições
CREATE OR REPLACE FUNCTION public.get_org_breadcrumb_friendly(entity_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  breadcrumb TEXT := '';
  current_id uuid := entity_id;
  current_description TEXT;
  current_parent uuid;
BEGIN
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
$$;

COMMENT ON FUNCTION public.get_org_breadcrumb_friendly(uuid) IS 'Retorna o breadcrumb hierárquico usando as descrições das unidades organizacionais';