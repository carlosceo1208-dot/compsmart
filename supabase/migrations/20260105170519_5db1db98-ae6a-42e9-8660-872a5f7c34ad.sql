-- Add gender column to profiles table for diversity metrics
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.gender IS 'Gênero: M=Masculino, F=Feminino, O=Outro, NULL=Não informado';