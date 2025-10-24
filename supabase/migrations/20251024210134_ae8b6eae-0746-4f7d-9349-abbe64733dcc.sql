-- Atualizar a função de validação para aceitar area, department, sector e project
CREATE OR REPLACE FUNCTION public.validate_unit_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  unit_type text;
BEGIN
  IF NEW.unit_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  SELECT type INTO unit_type
  FROM organizational_structure
  WHERE id = NEW.unit_id;
  
  IF unit_type IS NULL THEN
    RAISE EXCEPTION 'Unidade organizacional não encontrada';
  END IF;
  
  -- Agora aceita area, department, sector e project
  IF unit_type NOT IN ('area', 'department', 'sector', 'project') THEN
    RAISE EXCEPTION 'A unidade organizacional deve ser uma Área, Departamento, Setor ou Projeto. Tipo encontrado: %', unit_type;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_unit_type() IS 'Valida que a unidade organizacional do usuário seja do tipo área, departamento, setor ou projeto';