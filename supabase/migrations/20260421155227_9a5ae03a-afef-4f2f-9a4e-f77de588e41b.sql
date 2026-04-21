-- Expand status to include draft + submitted
ALTER TABLE public.talent_intelligence_recommendations
  DROP CONSTRAINT IF EXISTS talent_intelligence_recommendations_status_check;

ALTER TABLE public.talent_intelligence_recommendations
  ADD CONSTRAINT talent_intelligence_recommendations_status_check
  CHECK (status IN ('draft','submitted','pending','approved','rejected','applied'));

ALTER TABLE public.talent_intelligence_recommendations
  ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE public.talent_intelligence_recommendations
  ADD COLUMN IF NOT EXISTS submitted_by UUID,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approver_notes TEXT;

-- Audit trail
CREATE TABLE IF NOT EXISTS public.talent_recommendation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES public.talent_intelligence_recommendations(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created','submitted','approved','rejected','applied','edited','reverted')),
  actor_id UUID NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  notes TEXT,
  snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_talent_rec_history_rec ON public.talent_recommendation_history(recommendation_id);

ALTER TABLE public.talent_recommendation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members view talent rec history"
ON public.talent_recommendation_history FOR SELECT
USING (
  recommendation_id IN (
    SELECT id FROM public.talent_intelligence_recommendations
    WHERE root_company_id IN (SELECT root_company_id FROM public.profiles WHERE id = auth.uid())
  )
);

-- Auto-log changes
CREATE OR REPLACE FUNCTION public.log_talent_recommendation_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.talent_recommendation_history(recommendation_id, action, actor_id, new_status, snapshot)
    VALUES (NEW.id, 'created', COALESCE(auth.uid(), NEW.reviewed_by, NEW.submitted_by), NEW.status, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.talent_recommendation_history(recommendation_id, action, actor_id, previous_status, new_status, notes, snapshot)
    VALUES (
      NEW.id,
      CASE NEW.status
        WHEN 'submitted' THEN 'submitted'
        WHEN 'approved' THEN 'approved'
        WHEN 'rejected' THEN 'rejected'
        WHEN 'applied' THEN 'applied'
        ELSE 'edited'
      END,
      COALESCE(auth.uid(), NEW.reviewed_by, NEW.submitted_by),
      OLD.status, NEW.status, NEW.approver_notes, to_jsonb(NEW)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_talent_rec_log ON public.talent_intelligence_recommendations;
CREATE TRIGGER trg_talent_rec_log
  AFTER INSERT OR UPDATE ON public.talent_intelligence_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.log_talent_recommendation_change();

-- 9Box budget simulator: compares total recommendation impact vs ceiling per unit
CREATE OR REPLACE FUNCTION public.simulate_9box_budget(
  p_root_company_id UUID,
  p_fiscal_year INTEGER DEFAULT EXTRACT(YEAR FROM now())::INTEGER,
  p_ceiling_pct NUMERIC DEFAULT 5.0
)
RETURNS TABLE (
  unit_id UUID,
  unit_name TEXT,
  headcount INTEGER,
  current_payroll_annual NUMERIC,
  proposed_merit_impact_annual NUMERIC,
  payroll_increase_pct NUMERIC,
  ceiling_pct NUMERIC,
  ceiling_amount_annual NUMERIC,
  excess_annual NUMERIC,
  status TEXT,
  avg_box_position NUMERIC,
  high_performers INTEGER,
  low_performers INTEGER
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  WITH active_recs AS (
    SELECT
      p.unit_id,
      r.employee_id,
      r.box_position,
      COALESCE(r.current_salary, 0) AS current_salary,
      COALESCE(r.financial_impact_annual, 0) AS impact_annual
    FROM public.talent_intelligence_recommendations r
    JOIN public.profiles p ON p.id = r.employee_id
    WHERE r.root_company_id = p_root_company_id
      AND r.status IN ('draft','submitted','pending','approved')
  )
  SELECT
    o.id AS unit_id,
    o.name AS unit_name,
    COUNT(ar.employee_id)::INTEGER AS headcount,
    ROUND(SUM(ar.current_salary) * 12, 2) AS current_payroll_annual,
    ROUND(SUM(ar.impact_annual), 2) AS proposed_merit_impact_annual,
    CASE WHEN SUM(ar.current_salary) > 0
      THEN ROUND((SUM(ar.impact_annual) / (SUM(ar.current_salary) * 12)) * 100, 2)
      ELSE 0 END AS payroll_increase_pct,
    p_ceiling_pct AS ceiling_pct,
    ROUND(SUM(ar.current_salary) * 12 * (p_ceiling_pct / 100.0), 2) AS ceiling_amount_annual,
    GREATEST(
      ROUND(SUM(ar.impact_annual) - (SUM(ar.current_salary) * 12 * (p_ceiling_pct / 100.0)), 2),
      0
    ) AS excess_annual,
    CASE
      WHEN SUM(ar.current_salary) = 0 THEN 'sem dados'
      WHEN SUM(ar.impact_annual) > SUM(ar.current_salary) * 12 * (p_ceiling_pct / 100.0)
        THEN 'estouro'
      WHEN SUM(ar.impact_annual) > SUM(ar.current_salary) * 12 * (p_ceiling_pct / 100.0) * 0.85
        THEN 'atenção'
      ELSE 'dentro'
    END AS status,
    ROUND(AVG(ar.box_position)::NUMERIC, 2) AS avg_box_position,
    COUNT(*) FILTER (WHERE ar.box_position >= 7)::INTEGER AS high_performers,
    COUNT(*) FILTER (WHERE ar.box_position <= 3)::INTEGER AS low_performers
  FROM public.organizational_structure o
  LEFT JOIN active_recs ar ON ar.unit_id = o.id
  WHERE o.root_company_id = p_root_company_id OR o.id = p_root_company_id
  GROUP BY o.id, o.name
  HAVING COUNT(ar.employee_id) > 0
  ORDER BY proposed_merit_impact_annual DESC;
END;
$$;