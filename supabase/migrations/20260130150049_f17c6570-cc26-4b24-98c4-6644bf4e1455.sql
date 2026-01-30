-- Adicionar coluna is_read na tabela performance_kudos
ALTER TABLE performance_kudos 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Atualizar kudos existentes como já lidos
UPDATE performance_kudos SET is_read = true WHERE is_read IS NULL;

-- Habilitar realtime para a tabela performance_kudos
ALTER PUBLICATION supabase_realtime ADD TABLE public.performance_kudos;