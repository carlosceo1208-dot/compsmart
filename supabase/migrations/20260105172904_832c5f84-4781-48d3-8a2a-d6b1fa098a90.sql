-- Adicionar campo is_founder na tabela organizational_structure
ALTER TABLE organizational_structure 
ADD COLUMN IF NOT EXISTS is_founder BOOLEAN DEFAULT FALSE;

-- Trigger para marcar fundador automaticamente quando assinar no dia 07/02/2026
CREATE OR REPLACE FUNCTION mark_founder_on_subscription()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_status = 'active' 
     AND (OLD.subscription_status IS NULL OR OLD.subscription_status != 'active')
     AND CURRENT_DATE = '2026-02-07' THEN
    NEW.is_founder := TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_mark_founder ON organizational_structure;
CREATE TRIGGER trigger_mark_founder
BEFORE UPDATE ON organizational_structure
FOR EACH ROW EXECUTE FUNCTION mark_founder_on_subscription();