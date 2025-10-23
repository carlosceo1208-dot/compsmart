-- Create secure role management function to avoid RLS race conditions
create or replace function public.manage_user_roles(p_user_id uuid, p_roles app_role[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Bootstrap: if no admin exists, allow first caller to manage roles
  if not exists (select 1 from public.user_roles where role = 'admin') then
    -- allow without further checks
  elsif not has_any_role(auth.uid(), array['admin'::app_role, 'hr_manager'::app_role]) then
    raise exception 'permission denied';
  end if;

  -- Replace existing roles atomically
  delete from public.user_roles where user_id = p_user_id;
  insert into public.user_roles (user_id, role)
  select p_user_id, r
  from unnest(p_roles) as r
  on conflict (user_id, role) do nothing;
end;
$$;

-- Optional: allow authenticated users to execute (enforced by guard above)
-- GRANT EXECUTE ON FUNCTION public.manage_user_roles(uuid, app_role[]) TO authenticated;