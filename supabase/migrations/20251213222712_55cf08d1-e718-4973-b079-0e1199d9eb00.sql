-- Adicionar root_company_id à tabela system_labels para isolamento por empresa
ALTER TABLE public.system_labels 
ADD COLUMN IF NOT EXISTS root_company_id UUID REFERENCES public.organizational_structure(id) ON DELETE CASCADE;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_system_labels_root_company_id ON public.system_labels(root_company_id);

-- Atualizar RLS para system_labels
DROP POLICY IF EXISTS "Everyone can view labels" ON public.system_labels;
DROP POLICY IF EXISTS "Only admins can manage labels" ON public.system_labels;

-- Política SELECT: usuários veem labels da própria empresa OU templates globais (root_company_id = NULL)
CREATE POLICY "View own company labels or global templates" 
ON public.system_labels 
FOR SELECT 
USING (
  root_company_id IS NULL 
  OR root_company_id = get_user_company_id()
);

-- Política para Super Admin gerenciar templates globais
CREATE POLICY "Super admin manages global labels" 
ON public.system_labels 
FOR ALL 
USING (
  is_super_admin(auth.uid()) AND root_company_id IS NULL
);

-- Política para Admin/HR gerenciar labels da própria empresa
CREATE POLICY "Admin and HR manage company labels" 
ON public.system_labels 
FOR ALL 
USING (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]) 
  AND root_company_id = get_user_company_id()
)
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]) 
  AND root_company_id = get_user_company_id()
);