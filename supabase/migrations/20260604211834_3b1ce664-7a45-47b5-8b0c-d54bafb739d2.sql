ALTER TABLE public.organizational_structure
  ADD COLUMN IF NOT EXISTS risk_grade SMALLINT CHECK (risk_grade BETWEEN 1 AND 4),
  ADD COLUMN IF NOT EXISTS unit_role TEXT CHECK (unit_role IN ('matriz','filial'));