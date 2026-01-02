import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useBudgetSubmissions = (fiscalYear: number, statusFilter?: string, rootCompanyId?: string | null) => {
  return useQuery({
    queryKey: ['budget-submissions', fiscalYear, statusFilter, rootCompanyId],
    queryFn: async () => {
      // Se não tiver rootCompanyId, retornar vazio
      if (!rootCompanyId) return [];
      
      // Primeiro buscar unidades da empresa
      const { data: companyUnits } = await supabase
        .from('organizational_structure')
        .select('id')
        .eq('root_company_id', rootCompanyId)
        .in('type', ['area', 'department', 'sector', 'project']);
      
      const unitIds = companyUnits?.map(u => u.id) || [];
      
      // Buscar submissões apenas das unidades desta empresa
      let query = supabase
        .from('budget_submissions')
        .select(`
          *,
          unit:organizational_structure(id, code, description)
        `)
        .eq('fiscal_year', fiscalYear)
        .order('submitted_at', { ascending: false });

      // Filtrar por unidades da empresa ou submissão "empresa toda" (unit_id = null)
      if (unitIds.length > 0) {
        query = query.or(`unit_id.in.(${unitIds.join(',')}),unit_id.is.null`);
      } else {
        query = query.is('unit_id', null);
      }

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filtrar submissões "empresa toda" que não são desta empresa
      // (submissões sem unit_id precisam ser verificadas pelo contexto)
      const filteredData = (data || []).filter(submission => 
        submission.unit_id === null || unitIds.includes(submission.unit_id)
      );

      // Para cada submissão, buscar totais consolidados e perfis
      const submissionsWithTotals = await Promise.all(
        filteredData.map(async (submission) => {
          const { data: projections } = await supabase
            .from('budget_employee_projections')
            .select('projected_fixed_salary, projected_variable_salary, projected_benefits, month')
            .eq('fiscal_year', fiscalYear)
            .eq('projected_unit_id', submission.unit_id)
            .eq('is_active', true);

          const totalAnnual = projections?.reduce((sum, proj) => 
            sum + (proj.projected_fixed_salary || 0) + 
            (proj.projected_variable_salary || 0) + 
            (proj.projected_benefits || 0), 0
          ) || 0;

          // Buscar perfis de quem submeteu e revisou
          let submitted_by_profile = null;
          let reviewed_by_profile = null;

          if (submission.submitted_by) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', submission.submitted_by)
              .single();
            submitted_by_profile = profile;
          }

          if (submission.reviewed_by) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', submission.reviewed_by)
              .single();
            reviewed_by_profile = profile;
          }

          return {
            ...submission,
            totalAnnual,
            submitted_by_profile,
            reviewed_by_profile,
          };
        })
      );

      return submissionsWithTotals;
    },
    enabled: !!rootCompanyId,
  });
};
