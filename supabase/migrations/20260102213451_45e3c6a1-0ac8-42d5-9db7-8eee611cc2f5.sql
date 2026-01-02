-- Adicionar coluna para agendar exclusão de dados
ALTER TABLE organizational_structure 
ADD COLUMN IF NOT EXISTS data_deletion_scheduled_at TIMESTAMPTZ;

-- Índice para queries de expiração de trial
CREATE INDEX IF NOT EXISTS idx_org_trial_expiration 
ON organizational_structure(subscription_status, trial_ends_at) 
WHERE subscription_status = 'trial';

-- Índice para queries de exclusão de dados
CREATE INDEX IF NOT EXISTS idx_org_data_deletion 
ON organizational_structure(subscription_status, data_deletion_scheduled_at) 
WHERE subscription_status = 'expired';

-- Comentário explicativo
COMMENT ON COLUMN organizational_structure.data_deletion_scheduled_at IS 'Data agendada para exclusão dos dados após expiração do trial (7 dias de graça)';