ALTER TABLE public.organizational_structure 
  ADD COLUMN IF NOT EXISTS selected_plan TEXT,
  ADD COLUMN IF NOT EXISTS total_price NUMERIC(10,2);
CREATE INDEX IF NOT EXISTS idx_org_structure_selected_plan ON public.organizational_structure(selected_plan);