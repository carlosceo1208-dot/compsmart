-- Adicionar session_id às conversações dos assistentes
ALTER TABLE salary_assistant_conversations 
ADD COLUMN session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE;

ALTER TABLE incentive_assistant_conversations 
ADD COLUMN session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE;

-- Criar índices para melhorar performance
CREATE INDEX idx_salary_conversations_session ON salary_assistant_conversations(session_id);
CREATE INDEX idx_incentive_conversations_session ON incentive_assistant_conversations(session_id);