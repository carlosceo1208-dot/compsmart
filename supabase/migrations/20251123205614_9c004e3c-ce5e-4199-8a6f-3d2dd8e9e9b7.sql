-- Adicionar coluna logo_url na tabela organizational_structure
ALTER TABLE public.organizational_structure
ADD COLUMN logo_url TEXT;

COMMENT ON COLUMN organizational_structure.logo_url IS 'URL do logo da empresa no Supabase Storage';

-- Criar bucket de storage para logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
);

-- RLS Policies para o bucket company-logos
CREATE POLICY "Logos são públicos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-logos');

CREATE POLICY "Admins e HR podem fazer upload de logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-logos' 
  AND (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'hr_manager')
    )
  )
);

CREATE POLICY "Admins e HR podem atualizar logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'hr_manager')
    )
  )
);

CREATE POLICY "Admins e HR podem deletar logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'hr_manager')
    )
  )
);

-- Função para validar que apenas 1 empresa principal por usuário
CREATE OR REPLACE FUNCTION validate_single_company_per_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_company_count INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  IF NEW.type = 'company' AND TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO v_company_count
    FROM organizational_structure
    WHERE type = 'company'
    AND id IN (
      SELECT root_company_id FROM profiles WHERE id = v_user_id
    );
    
    IF v_company_count > 0 THEN
      RAISE EXCEPTION 'Você já possui uma empresa cadastrada. Para adicionar localizações, crie Matriz ou Filial.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_single_company
BEFORE INSERT ON organizational_structure
FOR EACH ROW
EXECUTE FUNCTION validate_single_company_per_user();

-- Validar que empresa não pode ter parent_id
CREATE OR REPLACE FUNCTION validate_company_no_parent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'company' AND NEW.parent_id IS NOT NULL THEN
    RAISE EXCEPTION 'Empresa principal não pode ter entidade pai';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_company_no_parent
BEFORE INSERT OR UPDATE ON organizational_structure
FOR EACH ROW
WHEN (NEW.type = 'company')
EXECUTE FUNCTION validate_company_no_parent();