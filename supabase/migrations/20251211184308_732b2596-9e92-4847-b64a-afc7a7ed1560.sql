
-- ============================================================
-- CARGA DE DADOS DE TESTE: PARTE 2
-- Cargos + Benefícios
-- ============================================================

-- 1. CRIAR CARGOS para TechStart (8 cargos)
INSERT INTO job_titles (code, title, grade, job_family, cbo, median_points, is_active)
VALUES 
  ('TECH-C01', 'Estagiário de Desenvolvimento', '001', 'Tecnologia', '3171-10', 100, true),
  ('TECH-C02', 'Desenvolvedor Júnior', '003', 'Tecnologia', '2124-05', 200, true),
  ('TECH-C03', 'Desenvolvedor Pleno', '005', 'Tecnologia', '2124-05', 350, true),
  ('TECH-C04', 'Desenvolvedor Sênior', '007', 'Tecnologia', '2124-05', 500, true),
  ('TECH-C05', 'Tech Lead', '008', 'Tecnologia', '2124-05', 650, true),
  ('TECH-C06', 'Analista Financeiro', '004', 'Administrativa', '2522-10', 280, true),
  ('TECH-C07', 'Analista de RH', '004', 'Administrativa', '2524-05', 280, true),
  ('TECH-C08', 'Gerente de Tecnologia', '009', 'Tecnologia', '1425-05', 800, true);

-- 2. CRIAR CARGOS para MédiaGrowth (12 cargos)
INSERT INTO job_titles (code, title, grade, job_family, cbo, median_points, is_active)
VALUES 
  ('MEDIA-C01', 'Estagiário MG', '001', 'Tecnologia', '3171-10', 100, true),
  ('MEDIA-C02', 'Analista de Dados Jr', '003', 'Tecnologia', '2124-10', 200, true),
  ('MEDIA-C03', 'Analista de Dados Pl', '005', 'Tecnologia', '2124-10', 350, true),
  ('MEDIA-C04', 'Analista de Dados Sr', '007', 'Tecnologia', '2124-10', 500, true),
  ('MEDIA-C05', 'Dev Júnior MG', '003', 'Tecnologia', '2124-05', 200, true),
  ('MEDIA-C06', 'Dev Pleno MG', '005', 'Tecnologia', '2124-05', 350, true),
  ('MEDIA-C07', 'Dev Sênior MG', '007', 'Tecnologia', '2124-05', 500, true),
  ('MEDIA-C08', 'Vendedor', '004', 'Comercial', '5211-10', 250, true),
  ('MEDIA-C09', 'Coordenador de Vendas', '006', 'Comercial', '1423-25', 420, true),
  ('MEDIA-C10', 'Analista de Marketing', '005', 'Comercial', '2531-05', 350, true),
  ('MEDIA-C11', 'Analista de RH MG', '004', 'Administrativa', '2524-05', 280, true),
  ('MEDIA-C12', 'Gerente de TI MG', '009', 'Tecnologia', '1425-05', 800, true);

-- 3. CRIAR CARGOS para CorpPro (16 cargos)
INSERT INTO job_titles (code, title, grade, job_family, cbo, median_points, is_active)
VALUES 
  ('CORP-C01', 'Estagiário CP', '001', 'Tecnologia', '3171-10', 100, true),
  ('CORP-C02', 'Assistente Administrativo', '002', 'Administrativa', '4110-10', 150, true),
  ('CORP-C03', 'Dev Júnior CP', '003', 'Tecnologia', '2124-05', 200, true),
  ('CORP-C04', 'Dev Pleno CP', '005', 'Tecnologia', '2124-05', 350, true),
  ('CORP-C05', 'Dev Sênior CP', '007', 'Tecnologia', '2124-05', 500, true),
  ('CORP-C06', 'Arquiteto de Software', '008', 'Tecnologia', '2124-05', 650, true),
  ('CORP-C07', 'Analista de Infraestrutura', '005', 'Tecnologia', '2124-15', 350, true),
  ('CORP-C08', 'Vendedor Corporativo', '005', 'Comercial', '5211-10', 320, true),
  ('CORP-C09', 'Gerente de Contas', '007', 'Comercial', '1423-25', 500, true),
  ('CORP-C10', 'Analista de Marketing CP', '005', 'Comercial', '2531-05', 350, true),
  ('CORP-C11', 'Contador', '006', 'Financeira', '2522-05', 420, true),
  ('CORP-C12', 'Analista Financeiro CP', '005', 'Financeira', '2522-10', 350, true),
  ('CORP-C13', 'Analista de RH CP', '005', 'Administrativa', '2524-05', 350, true),
  ('CORP-C14', 'Especialista em Remuneração', '007', 'Administrativa', '2524-05', 500, true),
  ('CORP-C15', 'Gerente de TI CP', '009', 'Tecnologia', '1425-05', 800, true),
  ('CORP-C16', 'Diretor de Operações', '010', 'Executiva', '1210-05', 950, true);

-- 4. CRIAR BENEFÍCIOS para TechStart (3 benefícios)
INSERT INTO benefits (name, benefit_type, description, value_per_employee, is_active, root_company_id)
SELECT name, btype, descr, val, true, (SELECT id FROM organizational_structure WHERE code = 'TECH-001')
FROM (VALUES 
  ('Vale Transporte TS', 'transportation', 'Vale transporte mensal', 400),
  ('Vale Alimentação TS', 'food_voucher', 'Vale alimentação mensal', 600),
  ('Plano de Saúde TS', 'health', 'Plano de saúde empresarial', 800)
) AS v(name, btype, descr, val);

-- 5. CRIAR BENEFÍCIOS para MédiaGrowth (5 benefícios)
INSERT INTO benefits (name, benefit_type, description, value_per_employee, is_active, root_company_id)
SELECT name, btype, descr, val, true, (SELECT id FROM organizational_structure WHERE code = 'MEDIA-001')
FROM (VALUES 
  ('Vale Transporte MG', 'transportation', 'Vale transporte mensal', 450),
  ('Vale Alimentação MG', 'food_voucher', 'Vale alimentação mensal', 700),
  ('Vale Refeição MG', 'meal_voucher', 'Vale refeição diário', 35),
  ('Plano de Saúde MG', 'health', 'Plano de saúde empresarial', 950),
  ('Plano Odontológico MG', 'dental', 'Plano odontológico', 120)
) AS v(name, btype, descr, val);

-- 6. CRIAR BENEFÍCIOS para CorpPro (8 benefícios)
INSERT INTO benefits (name, benefit_type, description, value_per_employee, is_active, root_company_id)
SELECT name, btype, descr, val, true, (SELECT id FROM organizational_structure WHERE code = 'CORP-001')
FROM (VALUES 
  ('Vale Transporte CP', 'transportation', 'Vale transporte mensal', 500),
  ('Vale Alimentação CP', 'food_voucher', 'Vale alimentação mensal', 850),
  ('Vale Refeição CP', 'meal_voucher', 'Vale refeição diário', 45),
  ('Plano de Saúde CP', 'health', 'Plano de saúde premium', 1200),
  ('Plano Odontológico CP', 'dental', 'Plano odontológico completo', 180),
  ('Seguro de Vida CP', 'life_insurance', 'Seguro de vida em grupo', 150),
  ('Previdência Privada CP', 'other', 'Previdência privada com matching', 500),
  ('Gympass CP', 'gym', 'Acesso a academias', 120)
) AS v(name, btype, descr, val);
