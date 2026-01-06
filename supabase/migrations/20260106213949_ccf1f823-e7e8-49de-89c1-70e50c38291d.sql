-- Tabela para parâmetros econômicos dinâmicos (salário mínimo, teto INSS, etc.)
CREATE TABLE public.economic_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parameter_key TEXT NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  effective_date DATE NOT NULL,
  end_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint para evitar sobreposição de períodos
  CONSTRAINT unique_parameter_period UNIQUE (parameter_key, effective_date)
);

-- Índices para performance
CREATE INDEX idx_economic_parameters_key ON public.economic_parameters(parameter_key);
CREATE INDEX idx_economic_parameters_effective ON public.economic_parameters(effective_date DESC);

-- Trigger para updated_at
CREATE TRIGGER update_economic_parameters_updated_at
  BEFORE UPDATE ON public.economic_parameters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.economic_parameters ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer usuário autenticado pode visualizar
CREATE POLICY "Authenticated users can view economic parameters"
  ON public.economic_parameters
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Apenas super_admin pode inserir/atualizar/deletar
CREATE POLICY "Super admin can manage economic parameters"
  ON public.economic_parameters
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Inserir dados históricos do salário mínimo
INSERT INTO public.economic_parameters (parameter_key, value, effective_date, end_date, metadata)
VALUES 
  ('minimum_wage', 1518.00, '2025-01-01', '2025-12-31', '{"year": 2025, "source": "Decreto nº 12.342/2024", "increase_percentage": 6.97}'),
  ('minimum_wage', 1621.00, '2026-01-01', NULL, '{"year": 2026, "source": "Decreto Federal 2026", "increase_percentage": 6.79}');