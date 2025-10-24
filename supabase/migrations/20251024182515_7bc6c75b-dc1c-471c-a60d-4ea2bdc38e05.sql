-- 1. Remover constraint de unicidade global do código (se existir)
ALTER TABLE public.organizational_structure 
DROP CONSTRAINT IF EXISTS organizational_structure_code_key;

-- 2. Criar índice único composto (parent_id, code) para unicidade entre irmãos
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_structure_sibling_code 
ON public.organizational_structure (parent_id, code) 
WHERE code IS NOT NULL;

-- 3. Criar índice em parent_id para performance
CREATE INDEX IF NOT EXISTS idx_organizational_structure_parent_id 
ON public.organizational_structure(parent_id);

-- 4. Função de validação de hierarquia
CREATE OR REPLACE FUNCTION public.validate_org_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
  parent_type TEXT;
  valid_parents TEXT[];
BEGIN
  -- Se não há parent_id e o tipo não é 'company', erro
  IF NEW.parent_id IS NULL AND NEW.type != 'company' THEN
    RAISE EXCEPTION 'Apenas entidades do tipo "company" podem não ter pai';
  END IF;

  -- Se é 'company' e tem pai, erro
  IF NEW.type = 'company' AND NEW.parent_id IS NOT NULL THEN
    RAISE EXCEPTION 'Empresas não podem ter entidade pai';
  END IF;

  -- Se tem parent_id, validar tipo do pai
  IF NEW.parent_id IS NOT NULL THEN
    SELECT type INTO parent_type
    FROM public.organizational_structure
    WHERE id = NEW.parent_id;

    -- Definir pais válidos por tipo
    CASE NEW.type
      WHEN 'headquarters' THEN valid_parents := ARRAY['company'];
      WHEN 'branch' THEN valid_parents := ARRAY['company'];
      WHEN 'area' THEN valid_parents := ARRAY['headquarters', 'branch'];
      WHEN 'department' THEN valid_parents := ARRAY['area'];
      WHEN 'sector' THEN valid_parents := ARRAY['department'];
      WHEN 'project' THEN valid_parents := ARRAY['sector'];
      ELSE RAISE EXCEPTION 'Tipo inválido: %', NEW.type;
    END CASE;

    -- Validar se o pai está na lista de válidos
    IF NOT (parent_type = ANY(valid_parents)) THEN
      RAISE EXCEPTION 'Uma entidade do tipo "%" não pode ter pai do tipo "%". Pais válidos: %', 
        NEW.type, parent_type, array_to_string(valid_parents, ', ');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger
DROP TRIGGER IF EXISTS check_org_hierarchy ON public.organizational_structure;
CREATE TRIGGER check_org_hierarchy
  BEFORE INSERT OR UPDATE ON public.organizational_structure
  FOR EACH ROW EXECUTE FUNCTION public.validate_org_hierarchy();