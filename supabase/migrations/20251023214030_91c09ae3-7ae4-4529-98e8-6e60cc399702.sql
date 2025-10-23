-- Add self-referencing foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'organizational_structure_parent_id_fkey'
  ) THEN
    ALTER TABLE public.organizational_structure 
    ADD CONSTRAINT organizational_structure_parent_id_fkey 
    FOREIGN KEY (parent_id) 
    REFERENCES public.organizational_structure(id) 
    ON DELETE SET NULL;
  END IF;
END $$;