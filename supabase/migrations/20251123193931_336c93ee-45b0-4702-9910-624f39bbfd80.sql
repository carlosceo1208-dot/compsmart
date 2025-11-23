-- ============================================
-- FASE 1: Adicionar root_company_id nas tabelas
-- ============================================

-- 1. Adicionar coluna root_company_id na tabela profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS root_company_id UUID REFERENCES public.organizational_structure(id);

-- 2. Popular com dados de teste (assumindo que existe ao menos 1 organizational_structure)
UPDATE public.profiles 
SET root_company_id = (
  SELECT id FROM public.organizational_structure 
  WHERE type = 'company'
  LIMIT 1
)
WHERE root_company_id IS NULL;

-- 3. Tornar obrigatório após popular
ALTER TABLE public.profiles 
  ALTER COLUMN root_company_id SET NOT NULL;

-- 4. Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_root_company 
  ON public.profiles(root_company_id);

-- 5. Adicionar root_company_id nas tabelas que não possuem
ALTER TABLE public.salary_tables 
  ADD COLUMN IF NOT EXISTS root_company_id UUID REFERENCES public.organizational_structure(id);

ALTER TABLE public.incentive_programs 
  ADD COLUMN IF NOT EXISTS root_company_id UUID REFERENCES public.organizational_structure(id);

ALTER TABLE public.benefits 
  ADD COLUMN IF NOT EXISTS root_company_id UUID REFERENCES public.organizational_structure(id);

-- 6. Popular com dados existentes (via primeiro organizational_structure disponível)
UPDATE public.salary_tables st
SET root_company_id = (
  SELECT id FROM public.organizational_structure WHERE type = 'company' LIMIT 1
)
WHERE st.root_company_id IS NULL;

UPDATE public.incentive_programs ip
SET root_company_id = (
  SELECT id FROM public.organizational_structure WHERE type = 'company' LIMIT 1
)
WHERE ip.root_company_id IS NULL;

UPDATE public.benefits b
SET root_company_id = (
  SELECT id FROM public.organizational_structure WHERE type = 'company' LIMIT 1
)
WHERE b.root_company_id IS NULL;

-- 7. Tornar obrigatório
ALTER TABLE public.salary_tables ALTER COLUMN root_company_id SET NOT NULL;
ALTER TABLE public.incentive_programs ALTER COLUMN root_company_id SET NOT NULL;
ALTER TABLE public.benefits ALTER COLUMN root_company_id SET NOT NULL;

-- 8. Índices
CREATE INDEX IF NOT EXISTS idx_salary_tables_root_company ON public.salary_tables(root_company_id);
CREATE INDEX IF NOT EXISTS idx_incentive_programs_root_company ON public.incentive_programs(root_company_id);
CREATE INDEX IF NOT EXISTS idx_benefits_root_company ON public.benefits(root_company_id);

-- ============================================
-- FASE 2: Função Helper e RLS Policies
-- ============================================

-- Função para obter a empresa do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT root_company_id 
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- ============================================
-- SALARY TABLES: Isolamento por empresa
-- ============================================
DROP POLICY IF EXISTS "Users can view salary tables" ON public.salary_tables;
DROP POLICY IF EXISTS "Admins and HR managers can manage salary tables" ON public.salary_tables;

CREATE POLICY "Users view own company salary tables"
  ON public.salary_tables FOR SELECT
  USING (root_company_id = get_user_company_id());

CREATE POLICY "Admins and HR manage own company salary tables"
  ON public.salary_tables FOR ALL
  USING (
    root_company_id = get_user_company_id() AND
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
  );

-- ============================================
-- INCENTIVE PROGRAMS: Isolamento por empresa
-- ============================================
DROP POLICY IF EXISTS "Users can view incentive programs" ON public.incentive_programs;
DROP POLICY IF EXISTS "Admins and HR can manage incentive programs" ON public.incentive_programs;

CREATE POLICY "Users view own company incentive programs"
  ON public.incentive_programs FOR SELECT
  USING (root_company_id = get_user_company_id());

CREATE POLICY "Admins and HR manage own company incentive programs"
  ON public.incentive_programs FOR ALL
  USING (
    root_company_id = get_user_company_id() AND
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
  );

-- ============================================
-- BENEFITS: Isolamento por empresa
-- ============================================
DROP POLICY IF EXISTS "Users can view benefits" ON public.benefits;
DROP POLICY IF EXISTS "Admins and HR can manage benefits" ON public.benefits;

CREATE POLICY "Users view own company benefits"
  ON public.benefits FOR SELECT
  USING (root_company_id = get_user_company_id());

CREATE POLICY "Admins and HR manage own company benefits"
  ON public.benefits FOR ALL
  USING (
    root_company_id = get_user_company_id() AND
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
  );

-- ============================================
-- PROFILES: Usuários veem apenas da própria empresa
-- ============================================
DROP POLICY IF EXISTS "Admins and HR view all profiles" ON public.profiles;

CREATE POLICY "Admins and HR view own company profiles"
  ON public.profiles FOR SELECT
  USING (
    (root_company_id = get_user_company_id() AND 
     has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]))
    OR
    (auth.uid() = id)
  );