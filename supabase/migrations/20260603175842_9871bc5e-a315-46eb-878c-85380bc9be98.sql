ALTER TABLE public.nr1_terceiros
  ADD COLUMN IF NOT EXISTS grau_risco SMALLINT CHECK (grau_risco BETWEEN 1 AND 4),
  ADD COLUMN IF NOT EXISTS emergencia_nome TEXT,
  ADD COLUMN IF NOT EXISTS emergencia_telefone TEXT,
  ADD COLUMN IF NOT EXISTS emergencia_email TEXT,
  ADD COLUMN IF NOT EXISTS contrato_inicio DATE;