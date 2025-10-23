-- Corrigir search_path da função validate_cpf_format para segurança
CREATE OR REPLACE FUNCTION public.validate_cpf_format(cpf_value TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  -- Permite NULL ou vazio
  IF cpf_value IS NULL OR cpf_value = '' THEN
    RETURN TRUE;
  END IF;
  
  -- Valida formato: apenas dígitos (11 caracteres) ou formato xxx.xxx.xxx-xx
  RETURN cpf_value ~ '^\d{11}$' OR cpf_value ~ '^\d{3}\.\d{3}\.\d{3}-\d{2}$';
END;
$$;