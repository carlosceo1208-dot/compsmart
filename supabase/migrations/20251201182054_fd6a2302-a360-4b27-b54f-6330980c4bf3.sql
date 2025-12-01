-- Criar tabela de aprovadores superiores
CREATE TABLE IF NOT EXISTS public.budget_approvers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  superior_approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  can_self_approve BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Adicionar colunas em budget_submissions para auto-aprovação
ALTER TABLE public.budget_submissions
ADD COLUMN IF NOT EXISTS is_self_approval BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS self_approval_justification TEXT,
ADD COLUMN IF NOT EXISTS requires_superior_approval BOOLEAN DEFAULT FALSE;

-- Habilitar RLS na tabela budget_approvers
ALTER TABLE public.budget_approvers ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem gerenciar aprovadores
CREATE POLICY "Admins can manage budget approvers"
ON public.budget_approvers FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Todos podem visualizar aprovadores (para saber quem é o superior)
CREATE POLICY "Users can view budget approvers"
ON public.budget_approvers FOR SELECT
USING (true);

-- Criar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_budget_approvers_user_id ON public.budget_approvers(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_approvers_superior_id ON public.budget_approvers(superior_approver_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_budget_approvers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_budget_approvers_timestamp
BEFORE UPDATE ON public.budget_approvers
FOR EACH ROW
EXECUTE FUNCTION update_budget_approvers_updated_at();