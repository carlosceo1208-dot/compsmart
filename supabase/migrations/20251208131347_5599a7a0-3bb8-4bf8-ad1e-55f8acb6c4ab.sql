-- Corrigir constraint para incluir 'salary' como agent_type válido
ALTER TABLE conversation_sessions DROP CONSTRAINT IF EXISTS conversation_sessions_agent_type_check;
ALTER TABLE conversation_sessions ADD CONSTRAINT conversation_sessions_agent_type_check 
  CHECK (agent_type = ANY (ARRAY['legal'::text, 'support'::text, 'incentive'::text, 'salary'::text]));