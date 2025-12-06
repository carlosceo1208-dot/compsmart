-- Fase 2: Criar função helper e políticas

-- Criar função helper para verificar super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Adicionar root_company_id à tabela survey_tables para diferenciar templates de pesquisas próprias
ALTER TABLE public.survey_tables ADD COLUMN IF NOT EXISTS root_company_id UUID REFERENCES organizational_structure(id);

-- Remover políticas antigas de survey_tables
DROP POLICY IF EXISTS "Admins and HR managers can manage survey tables" ON public.survey_tables;
DROP POLICY IF EXISTS "Users can view survey tables" ON public.survey_tables;
DROP POLICY IF EXISTS "Admins and HR manage own company salary tables" ON public.survey_tables;
DROP POLICY IF EXISTS "Users view own company salary tables" ON public.survey_tables;

-- Nova política: Super admin gerencia templates globais
CREATE POLICY "Super admin manages global templates" ON public.survey_tables
FOR ALL USING (
  root_company_id IS NULL AND is_super_admin(auth.uid())
);

-- Nova política: Admin/HR da empresa gerenciam pesquisas próprias
CREATE POLICY "Company admins manage own surveys" ON public.survey_tables
FOR ALL USING (
  root_company_id IS NOT NULL 
  AND root_company_id = get_user_company_id() 
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
);

-- Nova política: Visualização de templates públicos e pesquisas próprias
CREATE POLICY "View templates and own surveys" ON public.survey_tables
FOR SELECT USING (
  root_company_id IS NULL 
  OR root_company_id = get_user_company_id()
);

-- Atualizar política de site_content para super_admin
DROP POLICY IF EXISTS "Admins can manage site content" ON public.site_content;
CREATE POLICY "Super admin can manage site content" ON public.site_content
FOR ALL USING (is_super_admin(auth.uid()));

-- Atribuir role super_admin ao usuário principal
INSERT INTO public.user_roles (user_id, role)
VALUES ('4f0db627-3d32-4452-bddf-1f6ee3524551', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;