-- Criar tabela para conversas do Agente de Análise Salarial
CREATE TABLE IF NOT EXISTS salary_assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  context_data JSONB,
  document_name TEXT,
  operation_mode TEXT,
  tokens_used INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE salary_assistant_conversations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users view own salary assistant conversations"
ON salary_assistant_conversations FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users insert own salary assistant conversations"
ON salary_assistant_conversations FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins view all salary assistant conversations"
ON salary_assistant_conversations FOR SELECT
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- Índices para melhor performance
CREATE INDEX idx_salary_assistant_conversations_user_id ON salary_assistant_conversations(user_id);
CREATE INDEX idx_salary_assistant_conversations_created_at ON salary_assistant_conversations(created_at DESC);