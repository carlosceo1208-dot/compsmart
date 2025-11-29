-- Permitir email nulo na tabela profiles
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN profiles.email IS 'Email do usuário - opcional para funcionários sem acesso ao sistema';