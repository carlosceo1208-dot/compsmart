-- Add preferred_language column to profiles table for user language preference
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'pt-BR';

-- Add default_language column to organizational_structure table for company default language
ALTER TABLE organizational_structure 
ADD COLUMN IF NOT EXISTS default_language VARCHAR(10) DEFAULT 'pt-BR';

-- Add comment for documentation
COMMENT ON COLUMN profiles.preferred_language IS 'User preferred language code (pt-BR, es-LATAM, en-US)';
COMMENT ON COLUMN organizational_structure.default_language IS 'Company default language code (pt-BR, es-LATAM, en-US)';