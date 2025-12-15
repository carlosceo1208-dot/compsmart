-- Resetar senha do consultor1 para Consultor@2026!
UPDATE auth.users 
SET encrypted_password = crypt('Consultor@2026!', gen_salt('bf'))
WHERE email = 'consultor1@compsmart.ia.br';