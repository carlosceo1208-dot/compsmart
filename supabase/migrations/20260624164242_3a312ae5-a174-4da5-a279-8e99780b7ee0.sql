CREATE OR REPLACE FUNCTION public.get_visible_employees(p_user_id UUID, p_company_id UUID)
RETURNS TABLE(employee_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Guard: prevent impersonation. Only the caller themselves (or super admin) may query.
  IF p_user_id IS DISTINCT FROM auth.uid() AND NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  IF has_any_role(p_user_id, ARRAY['admin'::app_role, 'hr_manager'::app_role]) THEN
    RETURN QUERY
    SELECT id FROM profiles 
    WHERE root_company_id = p_company_id
      AND status = 'active'
      AND employee_number IS NOT NULL;
  ELSIF has_role(p_user_id, 'manager'::app_role) THEN
    RETURN QUERY
    SELECT id FROM profiles 
    WHERE (manager_id = p_user_id OR id = p_user_id)
      AND root_company_id = p_company_id
      AND status = 'active'
      AND employee_number IS NOT NULL;
  ELSE
    RETURN QUERY
    SELECT id FROM profiles 
    WHERE id = p_user_id
      AND root_company_id = p_company_id;
  END IF;
END;
$$;