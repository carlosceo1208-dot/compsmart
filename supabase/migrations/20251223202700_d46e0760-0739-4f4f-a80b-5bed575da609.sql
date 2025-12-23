-- 1. Adicionar coluna root_company_id (nullable inicialmente)
ALTER TABLE public.job_titles ADD COLUMN root_company_id UUID;

-- 2. Associar cargos às suas respectivas empresas baseado no código
UPDATE public.job_titles SET root_company_id = 
  CASE 
    WHEN code LIKE 'CORP-%' THEN '61b55283-af28-4f7d-a1f9-ac60a14834a6'::uuid
    WHEN code LIKE 'MEDIA-%' THEN 'b5256e1e-b564-4ba5-adaf-4200f5076e9a'::uuid
    WHEN code LIKE 'TECH-%' THEN '5693b084-72a2-4dfa-ae85-613172d4f5a9'::uuid
    ELSE 'b4ef7367-2068-4939-b455-f61ad9d7bc8c'::uuid
  END;

-- 3. Tornar coluna obrigatória
ALTER TABLE public.job_titles ALTER COLUMN root_company_id SET NOT NULL;

-- 4. Criar índice para performance
CREATE INDEX idx_job_titles_root_company ON public.job_titles(root_company_id);

-- 5. Adicionar foreign key
ALTER TABLE public.job_titles 
ADD CONSTRAINT job_titles_root_company_id_fkey 
FOREIGN KEY (root_company_id) REFERENCES public.organizational_structure(id);

-- 6. Habilitar RLS
ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas de isolamento
CREATE POLICY "Users view own company job titles" 
ON public.job_titles 
FOR SELECT 
USING (root_company_id = get_user_company_id());

CREATE POLICY "Admins and HR manage own company job titles" 
ON public.job_titles 
FOR ALL 
USING (
  root_company_id = get_user_company_id() 
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
);