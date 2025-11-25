-- Create company_identity table
CREATE TABLE company_identity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  root_company_id uuid NOT NULL REFERENCES organizational_structure(id) ON DELETE CASCADE,
  mission text,
  vision text,
  values jsonb DEFAULT '[]'::jsonb,
  annual_goal_year integer,
  annual_goal_description text,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(root_company_id)
);

-- Enable RLS
ALTER TABLE company_identity ENABLE ROW LEVEL SECURITY;

-- Users can view their company identity
CREATE POLICY "Users can view their company identity"
  ON company_identity FOR SELECT
  TO authenticated
  USING (root_company_id = get_user_company_id());

-- Admins and HR can manage company identity
CREATE POLICY "Admins and HR can manage company identity"
  ON company_identity FOR ALL
  TO authenticated
  USING (
    root_company_id = get_user_company_id() 
    AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
  );

-- Create trigger for updated_at
CREATE TRIGGER update_company_identity_updated_at
  BEFORE UPDATE ON company_identity
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert CompSmart default data (will be updated with actual company_id after)
INSERT INTO company_identity (
  root_company_id,
  mission,
  vision,
  values,
  annual_goal_year,
  annual_goal_description,
  is_visible
)
SELECT 
  id,
  'Tornar a remuneração corporativa mais justa, competitiva e inteligente, transformando dados salariais em decisões estratégicas que valorizam pessoas e impulsionam resultados.',
  'Ser a plataforma líder em gestão de remuneração estratégica no Brasil, reconhecida por democratizar o acesso à inteligência salarial e promover equidade em empresas de todos os portes.',
  '["Transparência", "Inovação", "Equidade", "Simplicidade", "Impacto"]'::jsonb,
  2025,
  'Alcançar 500 empresas ativas usando CompSmart e consolidar os três módulos (Core, Insight, Match) como referência em gestão de remuneração orientada por IA no mercado brasileiro.',
  true
FROM organizational_structure 
WHERE type = 'company'
LIMIT 1
ON CONFLICT (root_company_id) DO NOTHING;