-- 1. Tornar root_company_id nullable na tabela profiles
ALTER TABLE public.profiles ALTER COLUMN root_company_id DROP NOT NULL;

-- 2. Atualizar trigger para aceitar root_company_id NULL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_root_company_id uuid;
BEGIN
  -- Tenta extrair root_company_id do metadata, mas aceita NULL
  v_root_company_id := (NEW.raw_user_meta_data->>'root_company_id')::uuid;
  
  INSERT INTO public.profiles (id, full_name, email, root_company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.email,
    v_root_company_id
  );
  
  -- Só adiciona role employee se for criado por admin (tem root_company_id)
  IF v_root_company_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'employee');
  END IF;
  
  RETURN NEW;
END;
$$;