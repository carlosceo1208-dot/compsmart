
-- 1. Garantir que RLS está habilitado
ALTER TABLE public.super_admin_active_company ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas (se existirem) para recriar de forma estrita
DROP POLICY IF EXISTS "Super admins can view their own override" ON public.super_admin_active_company;
DROP POLICY IF EXISTS "Super admins can insert their own override" ON public.super_admin_active_company;
DROP POLICY IF EXISTS "Super admins can update their own override" ON public.super_admin_active_company;
DROP POLICY IF EXISTS "Super admins can delete their own override" ON public.super_admin_active_company;
DROP POLICY IF EXISTS "Users can view own override" ON public.super_admin_active_company;
DROP POLICY IF EXISTS "Users can insert own override" ON public.super_admin_active_company;
DROP POLICY IF EXISTS "Users can update own override" ON public.super_admin_active_company;
DROP POLICY IF EXISTS "Users can delete own override" ON public.super_admin_active_company;

-- 3. Políticas RLS estritas: apenas super_admin pode operar e somente sobre o próprio registro
CREATE POLICY "Super admins can view their own override"
ON public.super_admin_active_company
FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  AND user_id = auth.uid()
);

CREATE POLICY "Super admins can insert their own override"
ON public.super_admin_active_company
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_super_admin(auth.uid())
  AND user_id = auth.uid()
);

CREATE POLICY "Super admins can update their own override"
ON public.super_admin_active_company
FOR UPDATE
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  AND user_id = auth.uid()
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  AND user_id = auth.uid()
);

CREATE POLICY "Super admins can delete their own override"
ON public.super_admin_active_company
FOR DELETE
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  AND user_id = auth.uid()
);

-- 4. Trigger de defesa em profundidade: valida no backend mesmo se RLS for contornada
CREATE OR REPLACE FUNCTION public.validate_super_admin_override()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Permitir operações em contexto de service role (auth.uid() é NULL)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Bloquear se o usuário não for super_admin
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas super administradores podem gerenciar overrides de empresa ativa';
  END IF;

  -- Bloquear se o usuário tentar criar/alterar override para outro user_id
  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Você só pode gerenciar seu próprio override de empresa ativa';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_super_admin_override_trigger ON public.super_admin_active_company;

CREATE TRIGGER validate_super_admin_override_trigger
BEFORE INSERT OR UPDATE ON public.super_admin_active_company
FOR EACH ROW
EXECUTE FUNCTION public.validate_super_admin_override();
