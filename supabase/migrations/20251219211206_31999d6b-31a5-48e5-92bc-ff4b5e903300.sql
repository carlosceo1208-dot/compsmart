-- Add termination_date column to profiles table
ALTER TABLE public.profiles ADD COLUMN termination_date date DEFAULT NULL;

-- Create function to handle automatic status change on termination
CREATE OR REPLACE FUNCTION public.handle_termination_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Se termination_date foi preenchida, marcar como inativo
  IF NEW.termination_date IS NOT NULL AND (OLD.termination_date IS NULL OR OLD.termination_date IS DISTINCT FROM NEW.termination_date) THEN
    NEW.status := 'inactive';
  END IF;
  
  -- Se termination_date foi removida, marcar como ativo
  IF NEW.termination_date IS NULL AND OLD.termination_date IS NOT NULL THEN
    NEW.status := 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic status change
CREATE TRIGGER on_termination_date_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_termination_date();