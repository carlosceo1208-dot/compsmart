-- Adicionar comentários nas tabelas para forçar regeneração de tipos
COMMENT ON TABLE public.profiles IS 'Perfis de usuários do sistema';
COMMENT ON TABLE public.user_roles IS 'Papéis e permissões dos usuários';
COMMENT ON TABLE public.organizational_structure IS 'Estrutura organizacional da empresa';
COMMENT ON TABLE public.permissions IS 'Permissões disponíveis no sistema';
COMMENT ON TABLE public.role_permissions IS 'Relação entre papéis e permissões';
COMMENT ON TABLE public.audit_logs IS 'Logs de auditoria do sistema';