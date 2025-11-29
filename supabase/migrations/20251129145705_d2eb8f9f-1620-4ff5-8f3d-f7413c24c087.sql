-- Adicionar coluna hire_date na tabela profiles
ALTER TABLE profiles ADD COLUMN hire_date DATE;

-- Comentário para documentação
COMMENT ON COLUMN profiles.hire_date IS 'Data de admissão do funcionário';