-- ============================================
-- CORREÇÕES DE SEGURANÇA - POLÍTICAS RLS
-- ============================================

-- 1. CRÍTICO: Restringir acesso aos dados pessoais na tabela profiles
-- Drop da política permissiva existente
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Admins e HR managers podem ver todos os perfis
CREATE POLICY "Admins and HR view all profiles" ON public.profiles
  FOR SELECT 
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
  );

-- 2. MÉDIO: Restringir visualização de atribuições de função (user_roles)
-- Drop da política permissiva existente
DROP POLICY IF EXISTS "Users can view all user roles" ON public.user_roles;

-- Usuários podem ver apenas suas próprias funções
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Admins e HR podem ver todas as funções
CREATE POLICY "Admins and HR view all roles" ON public.user_roles
  FOR SELECT 
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
  );

-- 3. MÉDIO: Adicionar validação de formato CPF
-- Criar função para validar formato de CPF (xxx.xxx.xxx-xx ou xxxxxxxxxxx)
CREATE OR REPLACE FUNCTION public.validate_cpf_format(cpf_value TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Permite NULL ou vazio
  IF cpf_value IS NULL OR cpf_value = '' THEN
    RETURN TRUE;
  END IF;
  
  -- Valida formato: apenas dígitos (11 caracteres) ou formato xxx.xxx.xxx-xx
  RETURN cpf_value ~ '^\d{11}$' OR cpf_value ~ '^\d{3}\.\d{3}\.\d{3}-\d{2}$';
END;
$$;

-- Adicionar constraint de validação na tabela profiles
ALTER TABLE public.profiles
ADD CONSTRAINT valid_cpf_format 
CHECK (validate_cpf_format(cpf));

-- Adicionar comentário sobre dados sensíveis em audit_logs
COMMENT ON TABLE public.audit_logs IS 'ATENÇÃO: Esta tabela contém dados históricos sensíveis incluindo CPF e informações pessoais. Acesso restrito apenas a administradores. Considere implementar mascaramento ou criptografia de campos sensíveis para maior segurança.';