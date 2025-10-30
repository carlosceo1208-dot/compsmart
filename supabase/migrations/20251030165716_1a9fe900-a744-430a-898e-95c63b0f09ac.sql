-- Adicionar novos campos específicos para empresas na estrutura organizacional
ALTER TABLE public.organizational_structure
ADD COLUMN IF NOT EXISTS fantasy_name TEXT,
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS union_name TEXT,
ADD COLUMN IF NOT EXISTS base_date TEXT;

-- Adicionar índice único para CNPJ (único quando não nulo)
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_structure_cnpj 
ON public.organizational_structure(cnpj) 
WHERE cnpj IS NOT NULL;

-- Adicionar comentários explicativos
COMMENT ON COLUMN public.organizational_structure.fantasy_name IS 'Nome fantasia da empresa/unidade';
COMMENT ON COLUMN public.organizational_structure.cnpj IS 'CNPJ da empresa/unidade (formato: 00.000.000/0000-00)';
COMMENT ON COLUMN public.organizational_structure.address IS 'Endereço completo';
COMMENT ON COLUMN public.organizational_structure.union_name IS 'Nome do sindicato associado';
COMMENT ON COLUMN public.organizational_structure.base_date IS 'Data base sindical (formato MM/DD)';