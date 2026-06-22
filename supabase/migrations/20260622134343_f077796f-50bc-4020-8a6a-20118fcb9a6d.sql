
INSERT INTO public.subscription_plans (name, description, plan_type, monthly_price, annual_price, max_employees, max_users, features, is_active, is_public, sort_order)
VALUES
('Essencial', 'NR-1 para pequenas operações — diagnóstico COPSOQ-III e relatório de fiscalização', 'nr1', 250, 2700, 50, 2,
  '["Diagnóstico COPSOQ-III completo","Relatório PDF para fiscalização","Dashboard de risco psicossocial","Respondentes ilimitados"]'::jsonb,
  true, true, 10),
('Crescimento', 'NR-1 para empresas em crescimento — plano de ação e clima integrados', 'nr1', 1000, 10800, 200, 5,
  '["Tudo do Essencial","Plano de ação Kanban + evidências","Pesquisa de Clima integrada","Alertas inteligentes"]'::jsonb,
  true, true, 11),
('Consolidação', 'NR-1 para empresas consolidadas — cruzamentos e gestão de terceiros', 'nr1', 2500, 27000, 500, 10,
  '["Tudo do Crescimento","Cruzamento NR-1 × 9Box × Remuneração","Correlação COPSOQ × Clima","Gestão de terceiros (PGR)"]'::jsonb,
  true, true, 12),
('Performance', 'NR-1 para operações multi-unidade com relatórios C-Level', 'nr1', 3750, 40500, 750, 20,
  '["Tudo da Consolidação","Multi-unidades / multi-CNPJs","Relatórios executivos C-Level","Suporte prioritário"]'::jsonb,
  true, true, 13),
('Corporate', 'NR-1 corporativo — API, SSO e gerente de conta dedicado', 'nr1', 5000, 54000, 1000, 50,
  '["Tudo do Performance","API & webhooks","SSO corporativo","Gerente de conta dedicado"]'::jsonb,
  true, true, 14)
ON CONFLICT DO NOTHING;
