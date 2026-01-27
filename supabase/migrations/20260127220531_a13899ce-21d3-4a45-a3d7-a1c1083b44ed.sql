-- ============================================
-- SECURITY HARDENING MIGRATION
-- 1. RLS budget_submissions - Status restriction
-- 2. Rate Limiting infrastructure
-- 3. Audit triggers for sensitive operations
-- ============================================

-- ============================================
-- PART 1: CORREÇÃO RLS BUDGET_SUBMISSIONS
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Update submissions policy" ON budget_submissions;

-- Create improved policy with status restriction for managers
CREATE POLICY "Update submissions policy" ON budget_submissions
FOR UPDATE USING (
  -- Admin/HR podem atualizar qualquer submissao
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
  OR
  -- Managers so podem atualizar sua unidade E apenas em status editaveis
  (
    has_role(auth.uid(), 'manager'::app_role) 
    AND unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
    AND status IN ('draft', 'rejected', 'unlocked')
  )
);

-- ============================================
-- PART 2: RATE LIMITING INFRASTRUCTURE
-- ============================================

-- Create rate_limit_log table
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_function 
ON public.rate_limit_log(user_id, function_name, created_at DESC);

-- Enable RLS on rate_limit_log
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- RLS policy - users can only see their own logs
CREATE POLICY "Users can view own rate limit logs"
ON public.rate_limit_log FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert/delete (via edge functions and cleanup)
CREATE POLICY "Service can manage rate limit logs"
ON public.rate_limit_log FOR ALL
USING (true)
WITH CHECK (true);

-- Function to cleanup old rate limit logs (24h retention)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM rate_limit_log WHERE created_at < now() - interval '24 hours';
$$;

-- Function to check and record rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_function_name text,
  p_max_requests int DEFAULT 30,
  p_window_minutes int DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_count int;
BEGIN
  -- Limpar logs antigos primeiro (oportunistico)
  DELETE FROM rate_limit_log 
  WHERE user_id = p_user_id 
    AND function_name = p_function_name
    AND created_at < now() - interval '24 hours';

  -- Contar requisicoes na janela de tempo
  SELECT COUNT(*) INTO request_count
  FROM rate_limit_log
  WHERE user_id = p_user_id
    AND function_name = p_function_name
    AND created_at > now() - (p_window_minutes || ' minutes')::interval;
  
  -- Se dentro do limite, registrar e permitir
  IF request_count < p_max_requests THEN
    INSERT INTO rate_limit_log (user_id, function_name)
    VALUES (p_user_id, p_function_name);
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- ============================================
-- PART 3: AUDIT TRIGGERS FOR SENSITIVE OPERATIONS
-- ============================================

-- Trigger function for budget_submissions audit
CREATE OR REPLACE FUNCTION public.audit_budget_submissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Registrar apenas mudancas de status
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO audit_logs (
        user_id, 
        table_name, 
        action, 
        record_id, 
        old_data, 
        new_data
      ) VALUES (
        auth.uid(),
        'budget_submissions',
        'status_change',
        NEW.id::text,
        jsonb_build_object(
          'status', OLD.status,
          'unit_id', OLD.unit_id,
          'fiscal_year', OLD.fiscal_year
        ),
        jsonb_build_object(
          'status', NEW.status,
          'unit_id', NEW.unit_id,
          'fiscal_year', NEW.fiscal_year,
          'review_notes', NEW.review_notes
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trg_audit_budget_submissions ON budget_submissions;

CREATE TRIGGER trg_audit_budget_submissions
AFTER UPDATE ON budget_submissions
FOR EACH ROW
EXECUTE FUNCTION public.audit_budget_submissions();