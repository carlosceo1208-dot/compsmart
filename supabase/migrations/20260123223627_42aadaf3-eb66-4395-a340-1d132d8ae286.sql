-- Address security linter warnings (retry with pg_net recreate)

-- 1) Fix mutable search_path warnings by explicitly setting search_path
CREATE OR REPLACE FUNCTION public.mark_founder_on_subscription()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.subscription_status = 'active' 
     AND (OLD.subscription_status IS NULL OR OLD.subscription_status != 'active')
     AND CURRENT_DATE = '2026-01-07' THEN
    NEW.is_founder := TRUE;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If auth.uid() is NULL, we're in service role context (backend functions)
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
$$;


-- 2) Fix extensions-in-public warnings
CREATE SCHEMA IF NOT EXISTS extensions;

-- pg_trgm supports SET SCHEMA
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- pg_net does NOT support SET SCHEMA; recreate it in extensions schema
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net WITH SCHEMA extensions;


-- 3) Fix permissive RLS policies (WITH CHECK true) by removing them.
-- Service role bypasses RLS, so these policies are unnecessary.
DROP POLICY IF EXISTS "System can insert source citations" ON public.agent_source_citations;
DROP POLICY IF EXISTS "Allow insert from edge functions" ON public.auth_attempt_logs;
DROP POLICY IF EXISTS "Service role can insert security alerts" ON public.security_alerts;
