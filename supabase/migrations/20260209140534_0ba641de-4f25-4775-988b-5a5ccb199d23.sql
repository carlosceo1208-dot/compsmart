
-- Fix: Allow super_admin to manage role_permissions (was only admin before)
DROP POLICY IF EXISTS "role_permissions_admin_all" ON public.role_permissions;

CREATE POLICY "role_permissions_admin_or_super_admin_all"
ON public.role_permissions
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Add new permission: update_personal_data
INSERT INTO public.permissions (name, description)
VALUES ('update_personal_data', 'Permitir atualização de dados cadastrais pessoais (telefone, endereço, email, foto)')
ON CONFLICT DO NOTHING;
