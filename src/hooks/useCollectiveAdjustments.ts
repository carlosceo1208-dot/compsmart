import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ScaledRule {
  max_salary: number | null;
  percentage: number;
  fixed_amount: number;
}

export interface CollectiveAdjustment {
  id: string;
  fiscal_year: number;
  effective_month: number;
  adjustment_name: string;
  adjustment_type: 'fixed_percentage' | 'scaled';
  fixed_percentage?: number;
  scaled_rules?: ScaledRule[];
  filter_unit_id?: string;
  filter_grades?: string[];
  filter_salary_min?: number;
  filter_salary_max?: number;
  total_employees_affected: number;
  total_monthly_cost: number;
  total_annual_cost: number;
  status: 'simulation' | 'approved_budget' | 'effectuated';
  effectuated_at?: string;
  effectuated_by?: string;
  created_at: string;
  created_by: string;
  root_company_id: string;
}

export interface SimulationPreview {
  employeeId: string;
  employeeName: string;
  currentSalary: number;
  newSalary: number;
  increase: number;
  increasePercent: number;
  grade: string;
  unitId?: string;
}

export interface ScenarioConflict {
  code: 'SCENARIO_CONFLICT';
  existing: {
    id: string;
    adjustment_name: string;
    total_annual_cost: number;
  };
  message: string;
}

export const useCollectiveAdjustments = (fiscalYear?: number) => {
  const queryClient = useQueryClient();

  const adjustmentsQuery = useQuery({
    queryKey: ['collective-adjustments', fiscalYear],
    queryFn: async () => {
      let query = supabase
        .from('collective_salary_adjustments')
        .select('*')
        .order('created_at', { ascending: false });

      if (fiscalYear) {
        query = query.eq('fiscal_year', fiscalYear);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map(item => ({
        ...item,
        scaled_rules: item.scaled_rules as unknown as ScaledRule[] | undefined,
      })) as CollectiveAdjustment[];
    },
  });

  const pendingAdjustmentsQuery = useQuery({
    queryKey: ['pending-adjustments'],
    queryFn: async () => {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const { data, error } = await supabase
        .from('collective_salary_adjustments')
        .select('*')
        .eq('status', 'approved_budget')
        .lte('effective_month', currentMonth)
        .lte('fiscal_year', currentYear)
        .order('fiscal_year', { ascending: true })
        .order('effective_month', { ascending: true });

      if (error) throw error;

      return data.map(item => ({
        ...item,
        scaled_rules: item.scaled_rules as unknown as ScaledRule[] | undefined,
      })) as CollectiveAdjustment[];
    },
  });

  const createAdjustment = useMutation({
    mutationFn: async (adjustment: Omit<CollectiveAdjustment, 'id' | 'created_at' | 'effectuated_at' | 'effectuated_by'>) => {
      const { data, error } = await supabase
        .from('collective_salary_adjustments')
        .insert({
          ...adjustment,
          scaled_rules: adjustment.scaled_rules ? JSON.stringify(adjustment.scaled_rules) : undefined,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collective-adjustments'] });
      toast.success('Simulação salva com sucesso');
    },
    onError: (error) => {
      console.error('Error creating adjustment:', error);
      toast.error('Erro ao salvar simulação');
    },
  });

  const updateAdjustment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CollectiveAdjustment> & { id: string }) => {
      const { data, error } = await supabase
        .from('collective_salary_adjustments')
        .update({
          ...updates,
          scaled_rules: updates.scaled_rules ? JSON.stringify(updates.scaled_rules) : undefined,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collective-adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['pending-adjustments'] });
    },
    onError: (error) => {
      console.error('Error updating adjustment:', error);
      toast.error('Erro ao atualizar ajuste');
    },
  });

  const deleteAdjustment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('collective_salary_adjustments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collective-adjustments'] });
      toast.success('Simulação excluída');
    },
    onError: (error) => {
      console.error('Error deleting adjustment:', error);
      toast.error('Erro ao excluir simulação');
    },
  });

  const approveForBudget = useMutation({
    mutationFn: async (id: string) => {
      // 1. Buscar dados do ajuste atual
      const { data: adjustment, error: adjError } = await supabase
        .from('collective_salary_adjustments')
        .select('fiscal_year')
        .eq('id', id)
        .single();

      if (adjError) throw adjError;

      // 2. Verificar se já existe outro cenário aprovado para o mesmo ano fiscal
      const { data: existingApproved, error: existError } = await supabase
        .from('collective_salary_adjustments')
        .select('id, adjustment_name, total_annual_cost')
        .eq('fiscal_year', adjustment.fiscal_year)
        .eq('status', 'approved_budget')
        .neq('id', id);

      if (existError) throw existError;

      // 3. Se existir, lançar erro com dados do conflito
      if (existingApproved && existingApproved.length > 0) {
        const conflict: ScenarioConflict = {
          code: 'SCENARIO_CONFLICT',
          existing: existingApproved[0],
          message: 'Já existe um cenário aprovado para este ano fiscal'
        };
        throw conflict;
      }

      // 4. Se não existir conflito, aprovar normalmente
      const { data, error } = await supabase
        .from('collective_salary_adjustments')
        .update({ status: 'approved_budget' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collective-adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['budget-planning-annual-kpi'] });
      toast.success('Ajuste aprovado para o orçamento');
    },
    onError: (error: any) => {
      // Não mostrar toast para conflito - será tratado no componente
      if (error?.code === 'SCENARIO_CONFLICT') {
        return;
      }
      console.error('Error approving adjustment:', error);
      toast.error('Erro ao aprovar ajuste');
    },
  });

  // Nova mutation para substituir cenário existente
  const replaceApprovedScenario = useMutation({
    mutationFn: async ({ newId, fiscalYear }: { newId: string; fiscalYear: number }) => {
      // 1. Reverter cenário anterior para 'simulation'
      const { error: revertError } = await supabase
        .from('collective_salary_adjustments')
        .update({ status: 'simulation' })
        .eq('fiscal_year', fiscalYear)
        .eq('status', 'approved_budget')
        .neq('id', newId);

      if (revertError) throw revertError;

      // 2. Aprovar o novo cenário
      const { data, error } = await supabase
        .from('collective_salary_adjustments')
        .update({ status: 'approved_budget' })
        .eq('id', newId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collective-adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['budget-planning-annual-kpi'] });
      toast.success('Cenário substituído com sucesso');
    },
    onError: (error) => {
      console.error('Error replacing scenario:', error);
      toast.error('Erro ao substituir cenário');
    },
  });

  // Nova mutation para desconsiderar cenário do orçamento
  const revertToSimulation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('collective_salary_adjustments')
        .update({ status: 'simulation' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collective-adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['budget-planning-annual-kpi'] });
      toast.success('Cenário desconsiderado do orçamento');
    },
    onError: (error) => {
      console.error('Error reverting to simulation:', error);
      toast.error('Erro ao desconsiderar cenário');
    },
  });

  const effectuateSalaries = useMutation({
    mutationFn: async (adjustment: CollectiveAdjustment) => {
      // 1. Buscar funcionários afetados
      let query = supabase
        .from('profiles')
        .select('id, salary, grade, unit_id')
        .eq('status', 'active')
        .not('employee_number', 'is', null)
        .not('salary', 'is', null);

      if (adjustment.filter_unit_id) {
        query = query.eq('unit_id', adjustment.filter_unit_id);
      }
      if (adjustment.filter_grades && adjustment.filter_grades.length > 0) {
        query = query.in('grade', adjustment.filter_grades);
      }
      if (adjustment.filter_salary_min) {
        query = query.gte('salary', adjustment.filter_salary_min);
      }
      if (adjustment.filter_salary_max) {
        query = query.lte('salary', adjustment.filter_salary_max);
      }

      const { data: employees, error: empError } = await query;
      if (empError) throw empError;

      // 2. Calcular novos salários
      const updates = employees.map(emp => {
        const newSalary = calculateNewSalary(emp.salary, adjustment);
        return { id: emp.id, salary: newSalary };
      });

      // 3. Atualizar salários
      for (const update of updates) {
        const { error } = await supabase
          .from('profiles')
          .update({ salary: update.salary })
          .eq('id', update.id);
        
        if (error) throw error;
      }

      // 4. Marcar ajuste como efetivado
      const { data: user } = await supabase.auth.getUser();
      const { error: updateError } = await supabase
        .from('collective_salary_adjustments')
        .update({
          status: 'effectuated',
          effectuated_at: new Date().toISOString(),
          effectuated_by: user.user?.id,
        })
        .eq('id', adjustment.id);

      if (updateError) throw updateError;

      return { updatedCount: updates.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collective-adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['pending-adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['salary-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(`${data.updatedCount} salários atualizados com sucesso`);
    },
    onError: (error) => {
      console.error('Error effectuating salaries:', error);
      toast.error('Erro ao efetivar salários');
    },
  });

  return {
    adjustments: adjustmentsQuery.data || [],
    pendingAdjustments: pendingAdjustmentsQuery.data || [],
    isLoading: adjustmentsQuery.isLoading,
    isPendingLoading: pendingAdjustmentsQuery.isLoading,
    createAdjustment,
    updateAdjustment,
    deleteAdjustment,
    approveForBudget,
    replaceApprovedScenario,
    revertToSimulation,
    effectuateSalaries,
    refetch: () => {
      adjustmentsQuery.refetch();
      pendingAdjustmentsQuery.refetch();
    },
  };
};

// Função utilitária para calcular novo salário
export const calculateNewSalary = (
  currentSalary: number,
  adjustment: Pick<CollectiveAdjustment, 'adjustment_type' | 'fixed_percentage' | 'scaled_rules'>
): number => {
  if (adjustment.adjustment_type === 'fixed_percentage' && adjustment.fixed_percentage) {
    return currentSalary * (1 + adjustment.fixed_percentage / 100);
  }

  if (adjustment.adjustment_type === 'scaled' && adjustment.scaled_rules) {
    // Ordenar regras por max_salary (menores primeiro, null no final)
    const sortedRules = [...adjustment.scaled_rules].sort((a, b) => {
      if (a.max_salary === null) return 1;
      if (b.max_salary === null) return -1;
      return a.max_salary - b.max_salary;
    });

    // Encontrar a regra aplicável
    for (const rule of sortedRules) {
      if (rule.max_salary === null || currentSalary <= rule.max_salary) {
        const percentageIncrease = currentSalary * (rule.percentage / 100);
        return currentSalary + percentageIncrease + (rule.fixed_amount || 0);
      }
    }
  }

  return currentSalary;
};

// Função para calcular preview da simulação
export const calculateSimulationPreview = async (
  adjustment: Pick<CollectiveAdjustment, 'adjustment_type' | 'fixed_percentage' | 'scaled_rules' | 'filter_unit_id' | 'filter_grades' | 'filter_salary_min' | 'filter_salary_max'>
): Promise<SimulationPreview[]> => {
  let query = supabase
    .from('profiles')
    .select('id, full_name, salary, grade, unit_id')
    .eq('status', 'active')
    .not('salary', 'is', null);

  if (adjustment.filter_unit_id) {
    query = query.eq('unit_id', adjustment.filter_unit_id);
  }
  if (adjustment.filter_grades && adjustment.filter_grades.length > 0) {
    query = query.in('grade', adjustment.filter_grades);
  }
  if (adjustment.filter_salary_min) {
    query = query.gte('salary', adjustment.filter_salary_min);
  }
  if (adjustment.filter_salary_max) {
    query = query.lte('salary', adjustment.filter_salary_max);
  }

  const { data: employees, error } = await query;
  if (error) throw error;

  return employees.map(emp => {
    const newSalary = calculateNewSalary(emp.salary, adjustment);
    const increase = newSalary - emp.salary;
    const increasePercent = (increase / emp.salary) * 100;

    return {
      employeeId: emp.id,
      employeeName: emp.full_name,
      currentSalary: emp.salary,
      newSalary,
      increase,
      increasePercent,
      grade: emp.grade || '-',
      unitId: emp.unit_id,
    };
  });
};
