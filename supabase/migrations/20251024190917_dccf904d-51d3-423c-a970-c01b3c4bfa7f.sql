-- 1. Renomear position_id para unit_id
ALTER TABLE public.profiles 
RENAME COLUMN position_id TO unit_id;

-- 2. Adicionar comentário explicativo
COMMENT ON COLUMN public.profiles.unit_id IS 'Unidade organizacional onde o colaborador está alocado (Setor ou Projeto obrigatório)';

-- 3. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_unit_id ON public.profiles(unit_id);

-- 4. Criar função para obter breadcrumb hierárquico
CREATE OR REPLACE FUNCTION public.get_org_breadcrumb(entity_id uuid)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  breadcrumb TEXT := '';
  current_id uuid := entity_id;
  current_code TEXT;
  current_parent uuid;
BEGIN
  -- Percorrer hierarquia de baixo para cima
  WHILE current_id IS NOT NULL LOOP
    SELECT code, parent_id INTO current_code, current_parent
    FROM organizational_structure
    WHERE id = current_id;
    
    IF current_code IS NOT NULL THEN
      IF breadcrumb = '' THEN
        breadcrumb := current_code;
      ELSE
        breadcrumb := current_code || ' > ' || breadcrumb;
      END IF;
    END IF;
    
    current_id := current_parent;
  END LOOP;
  
  RETURN breadcrumb;
END;
$$;

-- 5. Criar função de validação para unit_id
CREATE OR REPLACE FUNCTION public.validate_unit_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  unit_type TEXT;
BEGIN
  -- Se unit_id for NULL, permitir (campo opcional)
  IF NEW.unit_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se unit_id é do tipo 'sector' ou 'project'
  SELECT type INTO unit_type
  FROM organizational_structure
  WHERE id = NEW.unit_id;
  
  IF unit_type IS NULL THEN
    RAISE EXCEPTION 'Unidade organizacional não encontrada';
  END IF;
  
  IF unit_type NOT IN ('sector', 'project') THEN
    RAISE EXCEPTION 'A unidade organizacional deve ser um Setor ou Projeto. Tipo encontrado: %', unit_type;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Criar trigger para validar unit_id antes de INSERT/UPDATE
DROP TRIGGER IF EXISTS validate_unit_type_trigger ON public.profiles;
CREATE TRIGGER validate_unit_type_trigger
  BEFORE INSERT OR UPDATE OF unit_id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_unit_type();