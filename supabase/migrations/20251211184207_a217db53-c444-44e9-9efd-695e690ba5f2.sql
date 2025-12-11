
-- ============================================================
-- CARGA DE DADOS DE TESTE: 3 EMPRESAS FICTÍCIAS (PARTE 1)
-- Estrutura Organizacional + Tabelas Salariais + Faixas
-- ============================================================

-- 1. CRIAR AS 3 EMPRESAS PRINCIPAIS
INSERT INTO organizational_structure (name, fantasy_name, code, type, cnpj, description, subscription_status, trial_ends_at)
VALUES 
  ('[TESTE] TechStart Ltda', 'TechStart', 'TECH-001', 'company', '11.111.111/0001-11', 'Startup de tecnologia - Plano Starter', 'active', NOW() + INTERVAL '30 days'),
  ('[TESTE] MédiaGrowth S.A.', 'MédiaGrowth', 'MEDIA-001', 'company', '22.222.222/0001-22', 'Empresa média em crescimento - Plano Medium', 'active', NOW() + INTERVAL '30 days'),
  ('[TESTE] CorpPro Corporação', 'CorpPro', 'CORP-001', 'company', '33.333.333/0001-33', 'Grande corporação - Plano Pro', 'active', NOW() + INTERVAL '30 days');

-- 2. CRIAR MATRIZES (headquarters) para cada empresa
INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Matriz São Paulo', 'TECH-HQ', 'headquarters', 'Sede principal TechStart', id, id
FROM organizational_structure WHERE code = 'TECH-001';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Matriz Rio de Janeiro', 'MEDIA-HQ', 'headquarters', 'Sede principal MédiaGrowth', id, id
FROM organizational_structure WHERE code = 'MEDIA-001';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Matriz Brasília', 'CORP-HQ', 'headquarters', 'Sede principal CorpPro', id, id
FROM organizational_structure WHERE code = 'CORP-001';

-- 3. CRIAR ÁREAS para TechStart (2 áreas)
INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Tecnologia', 'TECH-TI', 'area', 'Área de TI', id, (SELECT id FROM organizational_structure WHERE code = 'TECH-001')
FROM organizational_structure WHERE code = 'TECH-HQ';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Administrativo', 'TECH-ADM', 'area', 'Área Administrativa', id, (SELECT id FROM organizational_structure WHERE code = 'TECH-001')
FROM organizational_structure WHERE code = 'TECH-HQ';

-- 4. CRIAR ÁREAS para MédiaGrowth (3 áreas)
INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Tecnologia', 'MEDIA-TI', 'area', 'Área de TI', id, (SELECT id FROM organizational_structure WHERE code = 'MEDIA-001')
FROM organizational_structure WHERE code = 'MEDIA-HQ';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Comercial', 'MEDIA-COM', 'area', 'Área Comercial', id, (SELECT id FROM organizational_structure WHERE code = 'MEDIA-001')
FROM organizational_structure WHERE code = 'MEDIA-HQ';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'RH', 'MEDIA-RH', 'area', 'Recursos Humanos', id, (SELECT id FROM organizational_structure WHERE code = 'MEDIA-001')
FROM organizational_structure WHERE code = 'MEDIA-HQ';

-- 5. CRIAR ÁREAS para CorpPro (4 áreas)
INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Tecnologia', 'CORP-TI', 'area', 'Área de TI', id, (SELECT id FROM organizational_structure WHERE code = 'CORP-001')
FROM organizational_structure WHERE code = 'CORP-HQ';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Comercial', 'CORP-COM', 'area', 'Área Comercial', id, (SELECT id FROM organizational_structure WHERE code = 'CORP-001')
FROM organizational_structure WHERE code = 'CORP-HQ';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Financeiro', 'CORP-FIN', 'area', 'Área Financeira', id, (SELECT id FROM organizational_structure WHERE code = 'CORP-001')
FROM organizational_structure WHERE code = 'CORP-HQ';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'RH', 'CORP-RH', 'area', 'Recursos Humanos', id, (SELECT id FROM organizational_structure WHERE code = 'CORP-001')
FROM organizational_structure WHERE code = 'CORP-HQ';

-- 6. CRIAR DEPARTAMENTOS para TechStart (4 deptos)
INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Desenvolvimento', 'TECH-DEV', 'department', 'Desenvolvimento de Software', id, (SELECT id FROM organizational_structure WHERE code = 'TECH-001')
FROM organizational_structure WHERE code = 'TECH-TI';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Infraestrutura', 'TECH-INFRA', 'department', 'Infraestrutura e DevOps', id, (SELECT id FROM organizational_structure WHERE code = 'TECH-001')
FROM organizational_structure WHERE code = 'TECH-TI';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Financeiro', 'TECH-FIN', 'department', 'Departamento Financeiro', id, (SELECT id FROM organizational_structure WHERE code = 'TECH-001')
FROM organizational_structure WHERE code = 'TECH-ADM';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'RH', 'TECH-RHP', 'department', 'Recursos Humanos', id, (SELECT id FROM organizational_structure WHERE code = 'TECH-001')
FROM organizational_structure WHERE code = 'TECH-ADM';

-- 7. CRIAR DEPARTAMENTOS para MédiaGrowth (6 deptos)
INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Desenvolvimento', 'MEDIA-DEV', 'department', 'Desenvolvimento de Software', id, (SELECT id FROM organizational_structure WHERE code = 'MEDIA-001')
FROM organizational_structure WHERE code = 'MEDIA-TI';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Dados', 'MEDIA-DATA', 'department', 'Data Science e BI', id, (SELECT id FROM organizational_structure WHERE code = 'MEDIA-001')
FROM organizational_structure WHERE code = 'MEDIA-TI';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Vendas', 'MEDIA-VEND', 'department', 'Vendas', id, (SELECT id FROM organizational_structure WHERE code = 'MEDIA-001')
FROM organizational_structure WHERE code = 'MEDIA-COM';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Marketing', 'MEDIA-MKT', 'department', 'Marketing', id, (SELECT id FROM organizational_structure WHERE code = 'MEDIA-001')
FROM organizational_structure WHERE code = 'MEDIA-COM';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Recrutamento', 'MEDIA-REC', 'department', 'Recrutamento e Seleção', id, (SELECT id FROM organizational_structure WHERE code = 'MEDIA-001')
FROM organizational_structure WHERE code = 'MEDIA-RH';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'DP', 'MEDIA-DP', 'department', 'Departamento Pessoal', id, (SELECT id FROM organizational_structure WHERE code = 'MEDIA-001')
FROM organizational_structure WHERE code = 'MEDIA-RH';

-- 8. CRIAR DEPARTAMENTOS para CorpPro (8 deptos)
INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Desenvolvimento', 'CORP-DEV', 'department', 'Desenvolvimento de Software', id, (SELECT id FROM organizational_structure WHERE code = 'CORP-001')
FROM organizational_structure WHERE code = 'CORP-TI';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Infraestrutura', 'CORP-INFRA', 'department', 'Infraestrutura e Cloud', id, (SELECT id FROM organizational_structure WHERE code = 'CORP-001')
FROM organizational_structure WHERE code = 'CORP-TI';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Vendas', 'CORP-VEND', 'department', 'Vendas Corporativas', id, (SELECT id FROM organizational_structure WHERE code = 'CORP-001')
FROM organizational_structure WHERE code = 'CORP-COM';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Marketing', 'CORP-MKT', 'department', 'Marketing Digital', id, (SELECT id FROM organizational_structure WHERE code = 'CORP-001')
FROM organizational_structure WHERE code = 'CORP-COM';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Contabilidade', 'CORP-CONT', 'department', 'Contabilidade', id, (SELECT id FROM organizational_structure WHERE code = 'CORP-001')
FROM organizational_structure WHERE code = 'CORP-FIN';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Tesouraria', 'CORP-TES', 'department', 'Tesouraria', id, (SELECT id FROM organizational_structure WHERE code = 'CORP-001')
FROM organizational_structure WHERE code = 'CORP-FIN';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Recrutamento', 'CORP-REC', 'department', 'Recrutamento e Seleção', id, (SELECT id FROM organizational_structure WHERE code = 'CORP-001')
FROM organizational_structure WHERE code = 'CORP-RH';

INSERT INTO organizational_structure (name, code, type, description, parent_id, root_company_id)
SELECT 'Remuneração', 'CORP-REM', 'department', 'Remuneração e Benefícios', id, (SELECT id FROM organizational_structure WHERE code = 'CORP-001')
FROM organizational_structure WHERE code = 'CORP-RH';

-- 9. CRIAR TABELAS SALARIAIS com nomes ÚNICOS para cada empresa
INSERT INTO salary_tables (name, effective_month, effective_year, is_active, root_company_id)
SELECT 'TechStart - Tabela 2025', 1, 2025, true, id FROM organizational_structure WHERE code = 'TECH-001';

INSERT INTO salary_tables (name, effective_month, effective_year, is_active, root_company_id)
SELECT 'MédiaGrowth - Tabela 2025', 1, 2025, true, id FROM organizational_structure WHERE code = 'MEDIA-001';

INSERT INTO salary_tables (name, effective_month, effective_year, is_active, root_company_id)
SELECT 'CorpPro - Tabela 2025', 1, 2025, true, id FROM organizational_structure WHERE code = 'CORP-001';

-- 10. CRIAR FAIXAS SALARIAIS (grades 001-010) para TechStart
INSERT INTO salary_ranges (grade, min_value, q1_value, median_value, q3_value, max_value, calculation_mode, salary_table_id)
SELECT grade, min_val, q1_val, median_val, q3_val, max_val, 'manual', st.id
FROM (VALUES 
  ('001', 1800, 2000, 2200, 2400, 2600),
  ('002', 2200, 2500, 2800, 3100, 3400),
  ('003', 2800, 3200, 3600, 4000, 4400),
  ('004', 3500, 4000, 4500, 5000, 5500),
  ('005', 4500, 5200, 5900, 6600, 7300),
  ('006', 5800, 6800, 7800, 8800, 9800),
  ('007', 7500, 8800, 10100, 11400, 12700),
  ('008', 9500, 11200, 12900, 14600, 16300),
  ('009', 12000, 14200, 16400, 18600, 20800),
  ('010', 15000, 18000, 21000, 24000, 27000)
) AS v(grade, min_val, q1_val, median_val, q3_val, max_val)
CROSS JOIN salary_tables st
WHERE st.name = 'TechStart - Tabela 2025';

-- 11. CRIAR FAIXAS SALARIAIS para MédiaGrowth
INSERT INTO salary_ranges (grade, min_value, q1_value, median_value, q3_value, max_value, calculation_mode, salary_table_id)
SELECT grade, min_val, q1_val, median_val, q3_val, max_val, 'manual', st.id
FROM (VALUES 
  ('001', 2000, 2250, 2500, 2750, 3000),
  ('002', 2500, 2875, 3250, 3625, 4000),
  ('003', 3200, 3700, 4200, 4700, 5200),
  ('004', 4000, 4650, 5300, 5950, 6600),
  ('005', 5200, 6100, 7000, 7900, 8800),
  ('006', 6800, 8000, 9200, 10400, 11600),
  ('007', 8800, 10400, 12000, 13600, 15200),
  ('008', 11500, 13600, 15700, 17800, 19900),
  ('009', 15000, 17800, 20600, 23400, 26200),
  ('010', 19500, 23200, 26900, 30600, 34300)
) AS v(grade, min_val, q1_val, median_val, q3_val, max_val)
CROSS JOIN salary_tables st
WHERE st.name = 'MédiaGrowth - Tabela 2025';

-- 12. CRIAR FAIXAS SALARIAIS para CorpPro
INSERT INTO salary_ranges (grade, min_value, q1_value, median_value, q3_value, max_value, calculation_mode, salary_table_id)
SELECT grade, min_val, q1_val, median_val, q3_val, max_val, 'manual', st.id
FROM (VALUES 
  ('001', 2200, 2500, 2800, 3100, 3400),
  ('002', 2800, 3250, 3700, 4150, 4600),
  ('003', 3600, 4200, 4800, 5400, 6000),
  ('004', 4600, 5400, 6200, 7000, 7800),
  ('005', 6000, 7100, 8200, 9300, 10400),
  ('006', 7800, 9300, 10800, 12300, 13800),
  ('007', 10200, 12200, 14200, 16200, 18200),
  ('008', 13500, 16100, 18700, 21300, 23900),
  ('009', 17500, 21000, 24500, 28000, 31500),
  ('010', 23000, 27500, 32000, 36500, 41000)
) AS v(grade, min_val, q1_val, median_val, q3_val, max_val)
CROSS JOIN salary_tables st
WHERE st.name = 'CorpPro - Tabela 2025';
