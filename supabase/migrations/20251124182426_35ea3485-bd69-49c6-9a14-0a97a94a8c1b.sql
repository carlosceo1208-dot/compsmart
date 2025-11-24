-- Criar tabela conversation_sessions
CREATE TABLE conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('legal', 'support', 'incentive')),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  message_count INTEGER DEFAULT 0,
  root_company_id UUID REFERENCES organizational_structure(id)
);

-- Índices para performance
CREATE INDEX idx_sessions_user_agent ON conversation_sessions(user_id, agent_type, is_archived);
CREATE INDEX idx_sessions_last_message ON conversation_sessions(last_message_at DESC);

-- RLS Policies
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON conversation_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON conversation_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON conversation_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON conversation_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Adicionar session_id em legal_assistant_conversations
ALTER TABLE legal_assistant_conversations 
ADD COLUMN session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE;

-- Índice para buscar mensagens de uma sessão
CREATE INDEX idx_legal_conversations_session ON legal_assistant_conversations(session_id, created_at);

-- Função para auto-atualizar sessão ao adicionar mensagem
CREATE OR REPLACE FUNCTION update_session_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversation_sessions
  SET 
    last_message_at = NOW(),
    message_count = message_count + 1
  WHERE id = NEW.session_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar sessão
CREATE TRIGGER trigger_update_session
AFTER INSERT ON legal_assistant_conversations
FOR EACH ROW
WHEN (NEW.session_id IS NOT NULL)
EXECUTE FUNCTION update_session_on_message();