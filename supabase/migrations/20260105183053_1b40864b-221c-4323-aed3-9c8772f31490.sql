-- Inserir novas quick actions para onboarding/implantação
INSERT INTO support_quick_actions (question_text, page_path, priority, is_active)
VALUES 
  ('Qual a ordem correta para configurar o sistema?', '*', 100, true),
  ('Como inicio a implantação do CompSmart?', '/dashboard', 100, true),
  ('O que fazer após criar a conta?', '/dashboard', 95, true),
  ('Como começar a usar o sistema?', '*', 95, true),
  ('O que preciso configurar primeiro?', '/organization', 90, true)
ON CONFLICT DO NOTHING;