import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { differenceInDays, parseISO, format } from 'date-fns';

export interface UnitWithoutSubmission {
  id: string;
  code: string;
  description: string;
  type: string;
  managerEmail: string | null;
  managerName: string | null;
}

export interface BudgetDeadlineData {
  id: string | null;
  deadline: Date | null;
  daysRemaining: number;
  isOverdue: boolean;
  isUrgent: boolean;
  reminderDaysBefore: number[];
  lastReminderSentAt: Date | null;
}

export interface BudgetDeadlineStats {
  totalUnits: number;
  totalSubmitted: number;
  totalNotSubmitted: number;
  unitsWithoutSubmission: UnitWithoutSubmission[];
}

export const useBudgetDeadline = (fiscalYear: number) => {
  const queryClient = useQueryClient();

  // Buscar configuração de deadline
  const { data: deadlineData, isLoading: deadlineLoading } = useQuery({
    queryKey: ['budget-deadline', fiscalYear],
    queryFn: async (): Promise<BudgetDeadlineData> => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('root_company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.root_company_id) {
        return {
          id: null,
          deadline: null,
          daysRemaining: 0,
          isOverdue: false,
          isUrgent: false,
          reminderDaysBefore: [7, 3, 1],
          lastReminderSentAt: null,
        };
      }

      const { data, error } = await supabase
        .from('budget_deadline_settings')
        .select('*')
        .eq('fiscal_year', fiscalYear)
        .eq('root_company_id', profile.root_company_id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return {
          id: null,
          deadline: null,
          daysRemaining: 0,
          isOverdue: false,
          isUrgent: false,
          reminderDaysBefore: [7, 3, 1],
          lastReminderSentAt: null,
        };
      }

      const deadline = parseISO(data.deadline_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysRemaining = differenceInDays(deadline, today);

      return {
        id: data.id,
        deadline,
        daysRemaining,
        isOverdue: daysRemaining < 0,
        isUrgent: daysRemaining >= 0 && daysRemaining <= 7,
        reminderDaysBefore: data.reminder_days_before || [7, 3, 1],
        lastReminderSentAt: data.last_reminder_sent_at ? parseISO(data.last_reminder_sent_at) : null,
      };
    },
  });

  // Buscar estatísticas de submissões
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['budget-deadline-stats', fiscalYear],
    queryFn: async (): Promise<BudgetDeadlineStats> => {
      // Primeiro buscar o root_company_id do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('root_company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.root_company_id) {
        return {
          totalUnits: 0,
          totalSubmitted: 0,
          totalNotSubmitted: 0,
          unitsWithoutSubmission: [],
        };
      }

      // Buscar apenas unidades da empresa do usuário
      const { data: allUnits, error: unitsError } = await supabase
        .from('organizational_structure')
        .select('id, code, description, type')
        .eq('root_company_id', profile.root_company_id)
        .in('type', ['area', 'department', 'sector', 'project'])
        .order('code');

      if (unitsError) throw unitsError;

      // Buscar submissões do ano fiscal (apenas de unidades da empresa)
      const unitIds = allUnits?.map(u => u.id) || [];
      const { data: submissions, error: subsError } = await supabase
        .from('budget_submissions')
        .select('unit_id')
        .eq('fiscal_year', fiscalYear)
        .in('unit_id', unitIds.length > 0 ? unitIds : ['00000000-0000-0000-0000-000000000000']);

      if (subsError) throw subsError;

      const unitIdsWithSubmissions = new Set(
        submissions?.map(s => s.unit_id).filter(Boolean) || []
      );

      // Identificar unidades sem submissão
      const unitsWithoutSubmission: UnitWithoutSubmission[] = [];
      
      for (const unit of allUnits || []) {
        if (!unitIdsWithSubmissions.has(unit.id)) {
          // Buscar gestor da unidade (funcionário com role manager nesta unidade)
          const { data: managers } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('unit_id', unit.id)
            .limit(1);

          const manager = managers?.[0];
          
          unitsWithoutSubmission.push({
            id: unit.id,
            code: unit.code || '',
            description: unit.description || '',
            type: unit.type,
            managerEmail: manager?.email || null,
            managerName: manager?.full_name || null,
          });
        }
      }

      return {
        totalUnits: allUnits?.length || 0,
        totalSubmitted: unitIdsWithSubmissions.size,
        totalNotSubmitted: unitsWithoutSubmission.length,
        unitsWithoutSubmission,
      };
    },
  });

  // Mutation para criar/atualizar deadline
  const updateDeadlineMutation = useMutation({
    mutationFn: async (newDeadline: Date) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('root_company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.root_company_id) {
        throw new Error('Empresa não encontrada');
      }

      const { data: user } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('budget_deadline_settings')
        .upsert({
          fiscal_year: fiscalYear,
          root_company_id: profile.root_company_id,
          deadline_date: format(newDeadline, 'yyyy-MM-dd'),
          created_by: user.user?.id,
          reminder_days_before: [7, 3, 1],
        }, {
          onConflict: 'fiscal_year,root_company_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-deadline', fiscalYear] });
      toast.success('Data limite atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating deadline:', error);
      toast.error('Erro ao atualizar data limite');
    },
  });

  // Mutation para enviar lembretes
  const sendRemindersMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-budget-deadline-reminder', {
        body: {
          fiscalYear,
          automatic: false,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budget-deadline', fiscalYear] });
      toast.success(`Lembretes enviados para ${data?.sent || 0} gestores!`);
    },
    onError: (error) => {
      console.error('Error sending reminders:', error);
      toast.error('Erro ao enviar lembretes');
    },
  });

  return {
    deadlineData: deadlineData || {
      id: null,
      deadline: null,
      daysRemaining: 0,
      isOverdue: false,
      isUrgent: false,
      reminderDaysBefore: [7, 3, 1],
      lastReminderSentAt: null,
    },
    statsData: statsData || {
      totalUnits: 0,
      totalSubmitted: 0,
      totalNotSubmitted: 0,
      unitsWithoutSubmission: [],
    },
    isLoading: deadlineLoading || statsLoading,
    updateDeadline: updateDeadlineMutation.mutate,
    isUpdating: updateDeadlineMutation.isPending,
    sendReminders: sendRemindersMutation.mutate,
    isSendingReminders: sendRemindersMutation.isPending,
  };
};
