-- Remover foreign key que vincula profiles.id a auth.users.id
-- Isso permite criar perfis de funcionários sem usuário de autenticação
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Adicionar comentário explicativo
COMMENT ON COLUMN profiles.id IS 'ID único do perfil - pode ou não corresponder a um usuário auth.users';