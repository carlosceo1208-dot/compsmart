-- Adicionar campo unit_id na tabela budget para permitir orçamentos por unidade organizacional
ALTER TABLE budget ADD COLUMN unit_id UUID REFERENCES organizational_structure(id);

-- Criar índice único para evitar duplicatas (ano + mês + unidade)
-- Usando COALESCE para permitir NULL (orçamento total da empresa)
CREATE UNIQUE INDEX budget_unique_period_unit 
ON budget(fiscal_year, month, COALESCE(unit_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Adicionar comentário para documentação
COMMENT ON COLUMN budget.unit_id IS 'Unidade organizacional. NULL = Orçamento total da empresa';