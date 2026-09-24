import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCurrentUserRole = () => {
  return useQuery({
    queryKey: ['current-user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { 
          isManager: false, 
          isHR: false, 
          isAdmin: false,
          isSuperAdmin: false,
          isConsultor: false,
          unitId: null,
          userId: null
        };
      }

      // Buscar roles do usuário
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      // Buscar unidade do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('unit_id')
        .eq('id', user.id)
        .single();

      const userRoles = roles?.map(r => r.role) || [];

      return {
        isManager: userRoles.includes('manager'),
        isHR: userRoles.includes('hr_manager'),
        isAdmin: userRoles.includes('admin'),
        isSuperAdmin: userRoles.includes('super_admin'),
        isConsultor: userRoles.includes('consultor'),
        unitId: profile?.unit_id || null,
        userId: user.id
      };
    },
  });
};
