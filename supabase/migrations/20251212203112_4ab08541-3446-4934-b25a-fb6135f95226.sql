-- Adicionar campo industry_sector na tabela organizational_structure
ALTER TABLE public.organizational_structure 
ADD COLUMN IF NOT EXISTS industry_sector TEXT;

-- Comentário explicativo
COMMENT ON COLUMN public.organizational_structure.industry_sector IS 
  'Ramo de atividade da empresa para personalização de vocabulário dos agentes smart';