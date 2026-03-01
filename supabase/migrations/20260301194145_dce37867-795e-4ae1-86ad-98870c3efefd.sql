
-- Fix validate_single_company_per_user: add SET search_path = public
CREATE OR REPLACE FUNCTION public.validate_single_company_per_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_company_count INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  IF NEW.type = 'company' AND TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO v_company_count
    FROM organizational_structure
    WHERE type = 'company'
    AND id IN (
      SELECT root_company_id FROM profiles WHERE id = v_user_id
    );
    
    IF v_company_count > 0 THEN
      RAISE EXCEPTION 'Você já possui uma empresa cadastrada. Para adicionar localizações, crie Matriz ou Filial.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix validate_company_no_parent: add SET search_path = public
CREATE OR REPLACE FUNCTION public.validate_company_no_parent()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.type = 'company' AND NEW.parent_id IS NOT NULL THEN
    RAISE EXCEPTION 'Empresa principal não pode ter entidade pai';
  END IF;
  RETURN NEW;
END;
$function$;
