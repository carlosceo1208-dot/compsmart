-- Modificar o trigger validate_profile_update para permitir atualização de salary_range_percentage
CREATE OR REPLACE FUNCTION public.validate_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Se é admin ou HR, permite tudo
  IF has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]) THEN
    RETURN NEW;
  END IF;
  
  -- Se não é o próprio usuário, bloqueia
  IF auth.uid() != NEW.id THEN
    RAISE EXCEPTION 'Você não tem permissão para modificar este perfil';
  END IF;
  
  -- Se é o próprio usuário, verifica se está tentando modificar campos sensíveis
  -- IMPORTANTE: salary_range_percentage não é mais considerado campo sensível pois é calculado automaticamente
  IF OLD.salary IS DISTINCT FROM NEW.salary OR
     OLD.variable_salary IS DISTINCT FROM NEW.variable_salary OR
     OLD.grade IS DISTINCT FROM NEW.grade OR
     OLD.job_title_id IS DISTINCT FROM NEW.job_title_id OR
     OLD.unit_id IS DISTINCT FROM NEW.unit_id OR
     OLD.manager_id IS DISTINCT FROM NEW.manager_id OR
     OLD.has_system_access IS DISTINCT FROM NEW.has_system_access THEN
    RAISE EXCEPTION 'Você não pode modificar campos sensíveis como salário, cargo ou unidade';
  END IF;
  
  RETURN NEW;
END;
$function$;