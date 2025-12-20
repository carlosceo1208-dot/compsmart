-- Tabela para logs de tentativas de autenticação (segurança)
CREATE TABLE public.auth_attempt_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação do usuário (NULL se email não existir)
  email TEXT NOT NULL,
  user_id UUID,
  
  -- Resultado da tentativa
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('login', 'signup', 'password_reset', 'mfa_verify')),
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  
  -- Informações de segurança
  ip_address TEXT,
  user_agent TEXT,
  
  -- Metadados adicionais
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas rápidas de segurança
CREATE INDEX idx_auth_attempts_email ON public.auth_attempt_logs(email);
CREATE INDEX idx_auth_attempts_ip ON public.auth_attempt_logs(ip_address);
CREATE INDEX idx_auth_attempts_created ON public.auth_attempt_logs(created_at DESC);
CREATE INDEX idx_auth_attempts_success ON public.auth_attempt_logs(success);
CREATE INDEX idx_auth_attempts_type ON public.auth_attempt_logs(attempt_type);

-- Habilitar RLS
ALTER TABLE public.auth_attempt_logs ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins e HR podem visualizar logs de autenticação
CREATE POLICY "Admins and HR can view auth logs" 
ON public.auth_attempt_logs
FOR SELECT
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- Política: Permitir inserção via service role (edge functions)
CREATE POLICY "Allow insert from edge functions" 
ON public.auth_attempt_logs
FOR INSERT
WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE public.auth_attempt_logs IS 'Logs de auditoria de tentativas de autenticação para segurança';
COMMENT ON COLUMN public.auth_attempt_logs.attempt_type IS 'Tipo: login, signup, password_reset, mfa_verify';
COMMENT ON COLUMN public.auth_attempt_logs.failure_reason IS 'Motivo da falha: invalid_credentials, rate_limited, mfa_failed, etc';
COMMENT ON COLUMN public.auth_attempt_logs.ip_address IS 'Endereço IP do cliente (dado pessoal - LGPD)';