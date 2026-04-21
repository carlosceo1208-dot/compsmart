
-- ============================================================
-- BUDGET BURN-DOWN: Reconciliação orçamentária real
-- ============================================================

-- 1. Orçamento aprovado por unidade/ano
CREATE TABLE IF NOT EXISTS public.unit_merit_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_company_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  approved_amount_annual NUMERIC(14,2) NOT NULL CHECK (approved_amount_annual >= 0),
  ceiling_pct NUMERIC(5,2) NOT NULL DEFAULT 5.0,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (unit_id, fiscal_year)
);

CREATE INDEX IF NOT EXISTS idx_unit_merit_budgets_company ON public.unit_merit_budgets(root_company_id, fiscal_year);

ALTER TABLE public.unit_merit_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/HR can manage merit budgets"
ON public.unit_merit_budgets FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role]))
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role]));

CREATE POLICY "Authenticated can view merit budgets in their company"
ON public.unit_merit_budgets FOR SELECT
USING (root_company_id = (SELECT root_company_id FROM profiles WHERE id = auth.uid()));

CREATE TRIGGER trg_unit_merit_budgets_updated
BEFORE UPDATE ON public.unit_merit_budgets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Razão (ledger) imutável de movimentações
CREATE TABLE IF NOT EXISTS public.merit_budget_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.unit_merit_budgets(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL,
  fiscal_year INTEGER NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('talent_recommendation','merit_approval','manual_adjustment','reversal')),
  source_id UUID,
  employee_id UUID,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('reserve','debit','revert','adjust')),
  amount_annual NUMERIC(14,2) NOT NULL,
  balance_after NUMERIC(14,2),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merit_ledger_budget ON public.merit_budget_ledger(budget_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_merit_ledger_source ON public.merit_budget_ledger(source_type, source_id);

ALTER TABLE public.merit_budget_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view ledger in their company"
ON public.merit_budget_ledger FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.unit_merit_budgets b
  WHERE b.id = merit_budget_ledger.budget_id
    AND b.root_company_id = (SELECT root_company_id FROM profiles WHERE id = auth.uid())
));

CREATE POLICY "System can insert ledger entries"
ON public.merit_budget_ledger FOR INSERT
WITH CHECK (true);

-- 3. Função: status do orçamento da unidade
CREATE OR REPLACE FUNCTION public.get_unit_budget_status(
  p_root_company_id UUID,
  p_fiscal_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS TABLE(
  unit_id UUID,
  unit_name TEXT,
  fiscal_year INTEGER,
  approved_amount_annual NUMERIC,
  reserved_amount NUMERIC,
  consumed_amount NUMERIC,
  available_amount NUMERIC,
  burn_pct NUMERIC,
  status TEXT,
  ledger_count BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.unit_id,
    o.name AS unit_name,
    b.fiscal_year,
    b.approved_amount_annual,
    COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type = 'reserve'), 0) AS reserved_amount,
    COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type = 'debit'), 0)
      - COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type = 'revert'), 0) AS consumed_amount,
    b.approved_amount_annual
      - COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type IN ('debit','reserve')), 0)
      + COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type = 'revert'), 0) AS available_amount,
    CASE WHEN b.approved_amount_annual > 0 THEN
      ROUND((
        (COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type IN ('debit','reserve')), 0)
         - COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type = 'revert'), 0))
        / b.approved_amount_annual
      ) * 100, 2)
    ELSE 0 END AS burn_pct,
    CASE
      WHEN b.approved_amount_annual = 0 THEN 'no_budget'
      WHEN COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type IN ('debit','reserve')), 0)
           - COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type = 'revert'), 0)
           >= b.approved_amount_annual THEN 'exhausted'
      WHEN (COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type IN ('debit','reserve')), 0)
            - COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type = 'revert'), 0))
           / b.approved_amount_annual >= 0.95 THEN 'critical'
      WHEN (COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type IN ('debit','reserve')), 0)
            - COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type = 'revert'), 0))
           / b.approved_amount_annual >= 0.80 THEN 'warning'
      ELSE 'healthy'
    END AS status,
    COUNT(l.id) AS ledger_count
  FROM public.unit_merit_budgets b
  JOIN public.organizational_structure o ON o.id = b.unit_id
  LEFT JOIN public.merit_budget_ledger l ON l.budget_id = b.id
  WHERE b.root_company_id = p_root_company_id
    AND b.fiscal_year = p_fiscal_year
  GROUP BY b.id, b.unit_id, o.name, b.fiscal_year, b.approved_amount_annual
  ORDER BY o.name;
END;
$$;

-- 4. Função: verificar capacidade antes de aplicar
CREATE OR REPLACE FUNCTION public.check_budget_capacity(
  p_unit_id UUID,
  p_fiscal_year INTEGER,
  p_amount_annual NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_budget RECORD;
  v_consumed NUMERIC;
  v_available NUMERIC;
  v_burn_pct NUMERIC;
BEGIN
  SELECT * INTO v_budget FROM public.unit_merit_budgets
  WHERE unit_id = p_unit_id AND fiscal_year = p_fiscal_year;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'has_budget', false,
      'can_apply', false,
      'reason', 'Nenhum orçamento de mérito aprovado para esta unidade no ano fiscal ' || p_fiscal_year
    );
  END IF;

  SELECT
    COALESCE(SUM(amount_annual) FILTER (WHERE movement_type IN ('debit','reserve')), 0)
    - COALESCE(SUM(amount_annual) FILTER (WHERE movement_type = 'revert'), 0)
  INTO v_consumed
  FROM public.merit_budget_ledger WHERE budget_id = v_budget.id;

  v_available := v_budget.approved_amount_annual - v_consumed;
  v_burn_pct := CASE WHEN v_budget.approved_amount_annual > 0
    THEN ((v_consumed + p_amount_annual) / v_budget.approved_amount_annual) * 100
    ELSE 0 END;

  RETURN jsonb_build_object(
    'has_budget', true,
    'can_apply', p_amount_annual <= v_available,
    'approved_amount', v_budget.approved_amount_annual,
    'consumed_amount', v_consumed,
    'available_amount', v_available,
    'requested_amount', p_amount_annual,
    'projected_burn_pct', ROUND(v_burn_pct, 2),
    'reason', CASE
      WHEN p_amount_annual > v_available
        THEN 'Valor solicitado (R$ ' || ROUND(p_amount_annual,2) || ') excede orçamento disponível (R$ ' || ROUND(v_available,2) || ')'
      WHEN v_burn_pct >= 95
        THEN 'Aprovação levará consumo a ' || ROUND(v_burn_pct,1) || '% — requer override do CFO'
      ELSE 'Capacidade disponível'
    END
  );
END;
$$;

-- 5. Função: aplicar débito no orçamento
CREATE OR REPLACE FUNCTION public.apply_merit_to_budget(
  p_unit_id UUID,
  p_fiscal_year INTEGER,
  p_amount_annual NUMERIC,
  p_source_type TEXT,
  p_source_id UUID,
  p_employee_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_budget_id UUID;
  v_balance NUMERIC;
  v_ledger_id UUID;
BEGIN
  SELECT id INTO v_budget_id FROM public.unit_merit_budgets
  WHERE unit_id = p_unit_id AND fiscal_year = p_fiscal_year;

  IF v_budget_id IS NULL THEN
    -- cria budget zero se não existe (apenas registra o débito)
    INSERT INTO public.unit_merit_budgets(root_company_id, unit_id, fiscal_year, approved_amount_annual, notes, approved_by)
    SELECT root_company_id, id, p_fiscal_year, 0, 'Auto-criado por aplicação sem orçamento prévio', auth.uid()
    FROM public.organizational_structure WHERE id = p_unit_id
    RETURNING id INTO v_budget_id;
  END IF;

  SELECT (approved_amount_annual
    - COALESCE((SELECT SUM(amount_annual) FROM public.merit_budget_ledger
                WHERE budget_id = v_budget_id AND movement_type IN ('debit','reserve')), 0)
    + COALESCE((SELECT SUM(amount_annual) FROM public.merit_budget_ledger
                WHERE budget_id = v_budget_id AND movement_type = 'revert'), 0)
    - p_amount_annual)
  INTO v_balance
  FROM public.unit_merit_budgets WHERE id = v_budget_id;

  INSERT INTO public.merit_budget_ledger(
    budget_id, unit_id, fiscal_year, source_type, source_id, employee_id,
    movement_type, amount_annual, balance_after, notes, created_by
  ) VALUES (
    v_budget_id, p_unit_id, p_fiscal_year, p_source_type, p_source_id, p_employee_id,
    'debit', p_amount_annual, v_balance, p_notes, auth.uid()
  ) RETURNING id INTO v_ledger_id;

  RETURN v_ledger_id;
END;
$$;

-- 6. Função: estornar (reversal)
CREATE OR REPLACE FUNCTION public.revert_merit_from_budget(
  p_source_type TEXT,
  p_source_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_original RECORD;
  v_ledger_id UUID;
BEGIN
  SELECT * INTO v_original FROM public.merit_budget_ledger
  WHERE source_type = p_source_type AND source_id = p_source_id
    AND movement_type = 'debit'
  ORDER BY created_at DESC LIMIT 1;

  IF NOT FOUND THEN RETURN NULL; END IF;

  INSERT INTO public.merit_budget_ledger(
    budget_id, unit_id, fiscal_year, source_type, source_id, employee_id,
    movement_type, amount_annual, notes, created_by
  ) VALUES (
    v_original.budget_id, v_original.unit_id, v_original.fiscal_year,
    'reversal', p_source_id, v_original.employee_id,
    'revert', v_original.amount_annual,
    COALESCE(p_reason, 'Estorno automático'), auth.uid()
  ) RETURNING id INTO v_ledger_id;

  RETURN v_ledger_id;
END;
$$;

-- 7. Trigger: auto-débito ao aplicar talent recommendation
CREATE OR REPLACE FUNCTION public.auto_debit_talent_budget()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_unit_id UUID;
  v_fiscal_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'applied' AND OLD.status <> 'applied' THEN
      SELECT unit_id INTO v_unit_id FROM public.profiles WHERE id = NEW.employee_id;
      IF v_unit_id IS NOT NULL AND COALESCE(NEW.financial_impact_annual,0) > 0 THEN
        PERFORM public.apply_merit_to_budget(
          v_unit_id, v_fiscal_year, NEW.financial_impact_annual,
          'talent_recommendation', NEW.id, NEW.employee_id,
          'Aplicação de recomendação 9Box'
        );
      END IF;
    ELSIF OLD.status = 'applied' AND NEW.status IN ('rejected','draft') THEN
      PERFORM public.revert_merit_from_budget('talent_recommendation', NEW.id, 'Status revertido');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_debit_talent_budget ON public.talent_intelligence_recommendations;
CREATE TRIGGER trg_auto_debit_talent_budget
AFTER UPDATE ON public.talent_intelligence_recommendations
FOR EACH ROW EXECUTE FUNCTION public.auto_debit_talent_budget();

-- 8. Trigger: auto-débito ao aplicar merit approval
CREATE OR REPLACE FUNCTION public.auto_debit_merit_approval_budget()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_unit_id UUID;
  v_amount NUMERIC;
  v_fiscal_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'applied' AND OLD.status <> 'applied' THEN
      SELECT unit_id INTO v_unit_id FROM public.profiles WHERE id = NEW.employee_id;
      v_amount := COALESCE(NEW.annual_impact, 0);
      IF v_unit_id IS NOT NULL AND v_amount > 0 THEN
        PERFORM public.apply_merit_to_budget(
          v_unit_id, v_fiscal_year, v_amount,
          'merit_approval', NEW.id, NEW.employee_id,
          'Aplicação de mérito aprovado'
        );
      END IF;
    ELSIF OLD.status = 'applied' AND NEW.status IN ('rejected','cancelled') THEN
      PERFORM public.revert_merit_from_budget('merit_approval', NEW.id, 'Status revertido');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_debit_merit_approval_budget ON public.merit_approval_requests;
CREATE TRIGGER trg_auto_debit_merit_approval_budget
AFTER UPDATE ON public.merit_approval_requests
FOR EACH ROW EXECUTE FUNCTION public.auto_debit_merit_approval_budget();
