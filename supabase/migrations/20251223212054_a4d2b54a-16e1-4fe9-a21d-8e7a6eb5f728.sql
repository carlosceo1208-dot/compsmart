-- Corrigir função para filtrar por empresa (multi-tenancy)
CREATE OR REPLACE FUNCTION public.ensure_single_active_table()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.is_active = true THEN
    -- CORREÇÃO: Desativar apenas tabelas DA MESMA EMPRESA
    UPDATE public.salary_tables 
    SET is_active = false 
    WHERE id != NEW.id 
      AND is_active = true 
      AND root_company_id = NEW.root_company_id;
  END IF;
  RETURN NEW;
END;
$function$;