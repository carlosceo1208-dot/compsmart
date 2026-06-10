ALTER TABLE public.subscription_plans
  DROP CONSTRAINT IF EXISTS subscription_plans_plan_type_check;
ALTER TABLE public.subscription_plans
  ADD CONSTRAINT subscription_plans_plan_type_check
  CHECK (plan_type = ANY (ARRAY['starter','medium','pro','enterprise','custom','nr1']));

INSERT INTO public.subscription_plans
  (name, description, plan_type, monthly_price, annual_price, max_employees, is_active, is_public, sort_order, features)
SELECT * FROM (VALUES
  ('NR-1 Essencial',     'NR-1 conforme Portaria MTE — até 50 colaboradores',         'nr1',  250.00::numeric,  2700.00::numeric,   50, true, false, 101,
    '["Diagnóstico COPSOQ-III completo","Relatório PDF para fiscalização","Dashboard de risco psicossocial","Respondentes ilimitados"]'::jsonb),
  ('NR-1 Crescimento',   'NR-1 + Clima integrado — 51 a 200 colaboradores',           'nr1', 1000.00::numeric, 10800.00::numeric,  200, true, false, 102,
    '["Tudo do Essencial","Plano de ação Kanban + evidências","Pesquisa de Clima integrada","Alertas inteligentes"]'::jsonb),
  ('NR-1 Consolidação',  'NR-1 × 9Box × Remuneração — 201 a 500 colaboradores',       'nr1', 2500.00::numeric, 27000.00::numeric,  500, true, false, 103,
    '["Tudo do Crescimento","Cruzamento NR-1 × 9Box × Remuneração","Correlação COPSOQ × Clima","Gestão de terceiros (PGR)"]'::jsonb),
  ('NR-1 Performance',   'Multi-unidade — 501 a 750 colaboradores',                   'nr1', 3750.00::numeric, 40500.00::numeric,  750, true, false, 104,
    '["Tudo da Consolidação","Multi-unidades / multi-CNPJs","Relatórios executivos C-Level","Suporte prioritário"]'::jsonb),
  ('NR-1 Corporate',     'API + SSO + Gerente dedicado — 751 a 1.000 colaboradores',  'nr1', 5000.00::numeric, 54000.00::numeric, 1000, true, false, 105,
    '["Tudo do Performance","API & webhooks","SSO corporativo","Gerente de conta dedicado"]'::jsonb)
) AS v(name, description, plan_type, monthly_price, annual_price, max_employees, is_active, is_public, sort_order, features)
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscription_plans p WHERE p.name = v.name
);