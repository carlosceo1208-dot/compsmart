-- Fix validate_profile_update trigger to allow Edge Functions with Service Role Key
-- When auth.uid() is NULL, we're in service role context (Edge Functions)
CREATE OR REPLACE FUNCTION validate_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If auth.uid() is NULL, we're in service role context (Edge Functions)
  -- Allow the operation as service role is only used server-side
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- If user is admin or HR manager, allow all changes
  IF has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]) THEN
    RETURN NEW;
  END IF;
  
  -- If user is not the profile owner, block the update
  IF auth.uid() != NEW.id THEN
    RAISE EXCEPTION 'Você não tem permissão para modificar este perfil';
  END IF;
  
  -- If user is the profile owner, check for sensitive field changes
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
$$ LANGUAGE plpgsql SECURITY DEFINER;