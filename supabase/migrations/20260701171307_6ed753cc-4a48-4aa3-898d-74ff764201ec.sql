
CREATE OR REPLACE FUNCTION public.get_company_plan(_company_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT sp.plan_type
      FROM public.company_subscriptions cs
      JOIN public.subscription_plans sp ON sp.id = cs.plan_id
      WHERE cs.company_id = _company_id
        AND cs.status = 'active'
      ORDER BY cs.created_at DESC
      LIMIT 1
    ),
    (
      SELECT CASE
        WHEN os.subscription_status = 'trial'
             AND os.trial_ends_at IS NOT NULL
             AND os.trial_ends_at > now()
          THEN 'pro'
        ELSE 'starter'
      END
      FROM public.organizational_structure os
      WHERE os.id = _company_id
    ),
    'starter'
  );
$$;

CREATE OR REPLACE FUNCTION public.company_has_plan_tier(_company_id uuid, _min_tier text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranks(tier, rank) AS (
    VALUES ('starter',1),('medium',2),('pro',3),('enterprise',4)
  ),
  current_plan AS (
    SELECT public.get_company_plan(_company_id) AS plan_type
  )
  SELECT COALESCE(
    (SELECT r_cur.rank >= r_req.rank
     FROM current_plan cp
     JOIN ranks r_cur ON r_cur.tier = cp.plan_type
     JOIN ranks r_req ON r_req.tier = _min_tier),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_company_plan(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.company_has_plan_tier(uuid, text) TO authenticated, service_role;

-- Pro-tier gates (root_company_id present)
DROP POLICY IF EXISTS "plan_tier_pro_gate" ON public.merit_approval_requests;
CREATE POLICY "plan_tier_pro_gate" ON public.merit_approval_requests
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.company_has_plan_tier(root_company_id, 'pro'))
  WITH CHECK (public.company_has_plan_tier(root_company_id, 'pro'));

DROP POLICY IF EXISTS "plan_tier_pro_gate" ON public.unit_merit_budgets;
CREATE POLICY "plan_tier_pro_gate" ON public.unit_merit_budgets
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.company_has_plan_tier(root_company_id, 'pro'))
  WITH CHECK (public.company_has_plan_tier(root_company_id, 'pro'));

DROP POLICY IF EXISTS "plan_tier_pro_gate" ON public.decision_scenarios;
CREATE POLICY "plan_tier_pro_gate" ON public.decision_scenarios
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.company_has_plan_tier(root_company_id, 'pro'))
  WITH CHECK (public.company_has_plan_tier(root_company_id, 'pro'));

DROP POLICY IF EXISTS "plan_tier_pro_gate" ON public.cycle_decision_snapshots;
CREATE POLICY "plan_tier_pro_gate" ON public.cycle_decision_snapshots
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.company_has_plan_tier(root_company_id, 'pro'))
  WITH CHECK (public.company_has_plan_tier(root_company_id, 'pro'));

DROP POLICY IF EXISTS "plan_tier_pro_gate" ON public.pay_equity_alerts;
CREATE POLICY "plan_tier_pro_gate" ON public.pay_equity_alerts
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.company_has_plan_tier(root_company_id, 'pro'))
  WITH CHECK (public.company_has_plan_tier(root_company_id, 'pro'));

DROP POLICY IF EXISTS "plan_tier_pro_gate" ON public.pay_equity_regression_results;
CREATE POLICY "plan_tier_pro_gate" ON public.pay_equity_regression_results
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.company_has_plan_tier(root_company_id, 'pro'))
  WITH CHECK (public.company_has_plan_tier(root_company_id, 'pro'));

DROP POLICY IF EXISTS "plan_tier_pro_gate" ON public.incentive_programs;
CREATE POLICY "plan_tier_pro_gate" ON public.incentive_programs
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.company_has_plan_tier(root_company_id, 'pro'))
  WITH CHECK (public.company_has_plan_tier(root_company_id, 'pro'));

DROP POLICY IF EXISTS "plan_tier_pro_gate" ON public.executive_ltip_simulations;
CREATE POLICY "plan_tier_pro_gate" ON public.executive_ltip_simulations
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.company_has_plan_tier(root_company_id, 'pro'))
  WITH CHECK (public.company_has_plan_tier(root_company_id, 'pro'));

-- Child tables gated via parent (scenario/request)
DROP POLICY IF EXISTS "plan_tier_pro_gate" ON public.decision_scenario_items;
CREATE POLICY "plan_tier_pro_gate" ON public.decision_scenario_items
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.decision_scenarios s
      WHERE s.id = decision_scenario_items.scenario_id
        AND public.company_has_plan_tier(s.root_company_id, 'pro')
    )
  );

DROP POLICY IF EXISTS "plan_tier_pro_gate" ON public.merit_approval_history;
CREATE POLICY "plan_tier_pro_gate" ON public.merit_approval_history
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.merit_approval_requests r
      WHERE r.id = merit_approval_history.request_id
        AND public.company_has_plan_tier(r.root_company_id, 'pro')
    )
  );
