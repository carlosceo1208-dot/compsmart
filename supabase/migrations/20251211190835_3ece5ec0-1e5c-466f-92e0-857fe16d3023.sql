-- Tabela para armazenar a empresa ativa do super_admin
CREATE TABLE public.super_admin_active_company (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  active_company_id UUID NOT NULL REFERENCES organizational_structure(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.super_admin_active_company ENABLE ROW LEVEL SECURITY;

-- Only super_admin can manage their own active company
CREATE POLICY "Super admins can manage their active company"
ON public.super_admin_active_company
FOR ALL
USING (is_super_admin(auth.uid()) AND user_id = auth.uid())
WITH CHECK (is_super_admin(auth.uid()) AND user_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_super_admin_active_company_updated_at
BEFORE UPDATE ON public.super_admin_active_company
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Modificar a função get_user_company_id() para verificar override do super_admin
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- Primeiro: verifica se é super_admin com empresa override ativa
    (SELECT active_company_id 
     FROM public.super_admin_active_company 
     WHERE user_id = auth.uid()),
    -- Fallback: usa root_company_id do perfil
    (SELECT root_company_id 
     FROM public.profiles 
     WHERE id = auth.uid())
  )
  LIMIT 1;
$$;