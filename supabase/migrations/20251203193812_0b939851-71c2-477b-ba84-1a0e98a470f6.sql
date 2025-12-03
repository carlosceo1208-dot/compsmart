-- Adicionar coluna para percentual de encargos sociais
ALTER TABLE organizational_structure 
ADD COLUMN IF NOT EXISTS social_charges_percentage NUMERIC DEFAULT 0;

COMMENT ON COLUMN organizational_structure.social_charges_percentage IS 
'Percentual de encargos sociais da empresa (INSS, FGTS, 13º, Férias, etc.)';