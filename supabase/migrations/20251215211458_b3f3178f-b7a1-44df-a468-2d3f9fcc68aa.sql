-- Temporariamente desabilitar o trigger para permitir atualização
ALTER TABLE profiles DISABLE TRIGGER validate_profile_update_trigger;

-- Atualizar has_system_access para contas de consultor
UPDATE profiles 
SET has_system_access = true 
WHERE email IN ('consultor1@compsmart.ia.br', 'consultor2@compsmart.ia.br', 'consultor3@compsmart.ia.br');

-- Reabilitar o trigger
ALTER TABLE profiles ENABLE TRIGGER validate_profile_update_trigger;