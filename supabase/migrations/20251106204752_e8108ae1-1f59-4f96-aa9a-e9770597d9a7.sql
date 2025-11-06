-- Desabilitar temporariamente o trigger de validação para permitir a padronização dos grades
ALTER TABLE profiles DISABLE TRIGGER validate_profile_update_trigger;

-- Padronizar grades em profiles para o formato de 3 dígitos
UPDATE profiles
SET grade = LPAD(grade, 3, '0')
WHERE grade IS NOT NULL AND LENGTH(grade) < 3;

-- Reabilitar o trigger
ALTER TABLE profiles ENABLE TRIGGER validate_profile_update_trigger;