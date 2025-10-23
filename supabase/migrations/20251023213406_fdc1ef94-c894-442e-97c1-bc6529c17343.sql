-- Add position_id and manager_id columns to profiles table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'position_id') THEN
    ALTER TABLE public.profiles ADD COLUMN position_id uuid REFERENCES public.organizational_structure(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'manager_id') THEN
    ALTER TABLE public.profiles ADD COLUMN manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_position_id ON public.profiles(position_id);
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id ON public.profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_org_structure_parent_id ON public.organizational_structure(parent_id);
CREATE INDEX IF NOT EXISTS idx_org_structure_type ON public.organizational_structure(type);