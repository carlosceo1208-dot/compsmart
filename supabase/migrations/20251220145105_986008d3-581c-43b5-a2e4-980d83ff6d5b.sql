-- Desabilitar triggers de validação
ALTER TABLE profiles DISABLE TRIGGER validate_profile_update_trigger;
ALTER TABLE profiles DISABLE TRIGGER validate_unit_type_trigger;

-- Etapa 1: Limpar unit_id inválidos na empresa COMPSMART
UPDATE profiles 
SET unit_id = NULL, updated_at = NOW()
WHERE root_company_id = 'b4ef7367-2068-4939-b455-f61ad9d7bc8c'
  AND unit_id IS NOT NULL
  AND unit_id NOT IN (
    SELECT id FROM organizational_structure 
    WHERE root_company_id = 'b4ef7367-2068-4939-b455-f61ad9d7bc8c'
  );

-- Etapa 2: Limpar unit_id inválidos nas empresas TESTE
UPDATE profiles p
SET unit_id = NULL, updated_at = NOW()
WHERE p.root_company_id IN (
  '61b55283-af28-4f7d-a1f9-ac60a14834a6',
  'b5256e1e-b564-4ba5-adaf-4200f5076e9a',
  '5693b084-72a2-4dfa-ae85-613172d4f5a9'
)
AND p.unit_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM organizational_structure os
  WHERE os.id = p.unit_id 
  AND os.root_company_id = p.root_company_id
);

-- Reabilitar os triggers
ALTER TABLE profiles ENABLE TRIGGER validate_profile_update_trigger;
ALTER TABLE profiles ENABLE TRIGGER validate_unit_type_trigger;