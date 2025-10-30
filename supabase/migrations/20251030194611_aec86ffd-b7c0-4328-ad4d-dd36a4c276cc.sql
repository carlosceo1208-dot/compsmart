-- Add root_company_id column to track the root company for each entity
ALTER TABLE public.organizational_structure
ADD COLUMN root_company_id UUID REFERENCES public.organizational_structure(id);

-- Create index for better query performance
CREATE INDEX idx_org_structure_root_company ON public.organizational_structure(root_company_id);

-- Function to automatically set root_company_id
CREATE OR REPLACE FUNCTION public.update_root_company_id()
RETURNS TRIGGER AS $$
DECLARE
  parent_root_id UUID;
BEGIN
  -- Se é uma empresa, ela é a própria raiz
  IF NEW.type = 'company' THEN
    NEW.root_company_id := NEW.id;
  -- Matriz e Filial também são raiz (podem ter estruturas independentes)
  ELSIF NEW.type IN ('headquarters', 'branch') THEN
    NEW.root_company_id := NEW.id;
  -- Caso contrário, herda da entidade pai
  ELSIF NEW.parent_id IS NOT NULL THEN
    SELECT root_company_id INTO parent_root_id
    FROM public.organizational_structure
    WHERE id = NEW.parent_id;
    
    NEW.root_company_id := parent_root_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically update root_company_id
CREATE TRIGGER set_root_company_id
BEFORE INSERT OR UPDATE OF parent_id, type ON public.organizational_structure
FOR EACH ROW
EXECUTE FUNCTION public.update_root_company_id();

-- Populate root_company_id for existing records
WITH RECURSIVE org_tree AS (
  -- Base case: companies, headquarters and branches are their own root
  SELECT 
    id,
    id as root_company_id
  FROM public.organizational_structure
  WHERE type IN ('company', 'headquarters', 'branch')
  
  UNION ALL
  
  -- Recursive case: children inherit root from parent
  SELECT 
    o.id,
    ot.root_company_id
  FROM public.organizational_structure o
  INNER JOIN org_tree ot ON o.parent_id = ot.id
  WHERE o.type NOT IN ('company', 'headquarters', 'branch')
)
UPDATE public.organizational_structure os
SET root_company_id = ot.root_company_id
FROM org_tree ot
WHERE os.id = ot.id;