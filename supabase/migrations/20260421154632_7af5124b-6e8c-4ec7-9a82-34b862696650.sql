CREATE TABLE IF NOT EXISTS public.merit_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_company_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  unit_id UUID,
  fiscal_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now())::INTEGER,
  box_position INTEGER,
  performance_score NUMERIC(3,2),
  current_salary NUMERIC(12,2) NOT NULL,
  compa_ratio NUMERIC(5,3),
  range_position_pct NUMERIC(5,2),
  months_since_last_raise INTEGER,
  suggested_merit_pct NUMERIC(5,2) NOT NULL,
  requested_merit_pct NUMERIC(5,2) NOT NULL,
  new_salary NUMERIC(12,2) NOT NULL,
  monthly_impact NUMERIC(12,2) NOT NULL,
  annual_impact NUMERIC(12,2) NOT NULL,
  budget_available_pct NUMERIC(5,2),
  budget_remaining_annual NUMERIC(14,2),
  budget_after_request NUMERIC(14,2),
  justification TEXT NOT NULL CHECK (length(trim(justification)) >= 20),
  override_reason TEXT,
  gate_warnings JSONB DEFAULT '[]'::jsonb,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','cancelled','applied')),
  requested_by UUID NOT NULL,
  approver_id UUID,
  approval_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  applied_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merit_approval_company ON public.merit_approval_requests(root_company_id);
CREATE INDEX IF NOT EXISTS idx_merit_approval_employee ON public.merit_approval_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_merit_approval_status ON public.merit_approval_requests(status);

CREATE TABLE IF NOT EXISTS public.merit_approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.merit_approval_requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created','approved','rejected','cancelled','applied','edited')),
  actor_id UUID NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  notes TEXT,
  snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merit_approval_history_request ON public.merit_approval_history(request_id);

CREATE TRIGGER update_merit_approval_requests_updated_at
  BEFORE UPDATE ON public.merit_approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.log_merit_approval_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.merit_approval_history(request_id, action, actor_id, new_status, snapshot)
    VALUES (NEW.id, 'created', NEW.requested_by, NEW.status, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.merit_approval_history(request_id, action, actor_id, previous_status, new_status, notes, snapshot)
    VALUES (
      NEW.id,
      CASE NEW.status WHEN 'approved' THEN 'approved' WHEN 'rejected' THEN 'rejected'
        WHEN 'cancelled' THEN 'cancelled' WHEN 'applied' THEN 'applied' ELSE 'edited' END,
      COALESCE(NEW.approver_id, NEW.applied_by, NEW.requested_by),
      OLD.status, NEW.status, NEW.approval_notes, to_jsonb(NEW)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_merit_approval_log
  AFTER INSERT OR UPDATE ON public.merit_approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_merit_approval_change();

ALTER TABLE public.merit_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merit_approval_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view merit approvals"
ON public.merit_approval_requests FOR SELECT
USING (root_company_id IN (SELECT root_company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "HR and managers can create merit requests"
ON public.merit_approval_requests FOR INSERT
WITH CHECK (
  requested_by = auth.uid()
  AND root_company_id IN (SELECT root_company_id FROM public.profiles WHERE id = auth.uid())
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_manager'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
);

CREATE POLICY "HR and admin can review merit requests"
ON public.merit_approval_requests FOR UPDATE
USING (
  root_company_id IN (SELECT root_company_id FROM public.profiles WHERE id = auth.uid())
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_manager'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR (requested_by = auth.uid() AND status = 'pending')
  )
);

CREATE POLICY "Company members can view merit history"
ON public.merit_approval_history FOR SELECT
USING (
  request_id IN (
    SELECT id FROM public.merit_approval_requests
    WHERE root_company_id IN (SELECT root_company_id FROM public.profiles WHERE id = auth.uid())
  )
);

CREATE OR REPLACE FUNCTION public.evaluate_merit_governance(
  p_employee_id UUID,
  p_requested_pct NUMERIC,
  p_suggested_pct NUMERIC,
  p_compa_ratio NUMERIC,
  p_months_since_last_raise INTEGER,
  p_budget_available_pct NUMERIC,
  p_annual_impact NUMERIC,
  p_budget_remaining_annual NUMERIC
)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_warnings JSONB := '[]'::jsonb;
  v_blocked BOOLEAN := false;
  v_requires_override BOOLEAN := false;
BEGIN
  IF p_compa_ratio IS NOT NULL AND p_compa_ratio >= 1.20 AND p_requested_pct > 0 THEN
    v_warnings := v_warnings || jsonb_build_object(
      'code','COMPA_ABOVE_CEILING','severity','high',
      'message','Compa-ratio ' || ROUND(p_compa_ratio*100,1) || '% acima do teto da faixa (120%). Requer justificativa de override.'
    );
    v_requires_override := true;
  END IF;

  IF p_months_since_last_raise IS NOT NULL AND p_months_since_last_raise < 6 AND p_requested_pct > 0 THEN
    v_warnings := v_warnings || jsonb_build_object(
      'code','RECENT_RAISE','severity','critical',
      'message','Último aumento há ' || p_months_since_last_raise || ' meses (mínimo 6). Aumento bloqueado.'
    );
    v_blocked := true;
  END IF;

  IF p_budget_remaining_annual IS NOT NULL AND p_annual_impact > p_budget_remaining_annual THEN
    v_warnings := v_warnings || jsonb_build_object(
      'code','BUDGET_EXCEEDED','severity','critical',
      'message','Impacto anual (R$ ' || ROUND(p_annual_impact,2) || ') excede budget restante (R$ ' || ROUND(p_budget_remaining_annual,2) || ').'
    );
    v_blocked := true;
  END IF;

  IF p_budget_available_pct IS NOT NULL AND p_budget_available_pct < 25 THEN
    v_warnings := v_warnings || jsonb_build_object(
      'code','BUDGET_LOW','severity','medium',
      'message','Apenas ' || ROUND(p_budget_available_pct,1) || '% do budget disponível. Avaliar prioridade.'
    );
  END IF;

  IF ABS(COALESCE(p_requested_pct,0) - COALESCE(p_suggested_pct,0)) > 1.0 THEN
    v_warnings := v_warnings || jsonb_build_object(
      'code','OVERRIDE_SUGGESTION','severity','medium',
      'message','Valor solicitado (' || p_requested_pct || '%) diverge da sugestão da matriz (' || p_suggested_pct || '%). Justifique o override.'
    );
    v_requires_override := true;
  END IF;

  RETURN jsonb_build_object(
    'warnings', v_warnings,
    'is_blocked', v_blocked,
    'requires_override', v_requires_override,
    'can_submit', NOT v_blocked
  );
END;
$$;