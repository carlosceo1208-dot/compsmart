import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send } from 'lucide-react';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { useBudgetSummary } from '@/hooks/useBudgetSummary';
import { useSubmissionStatus } from '@/hooks/useSubmissionStatus';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BudgetPlanningFilterPanel } from '@/components/budget/BudgetPlanningFilterPanel';
import { BudgetSummaryTable } from '@/components/budget/BudgetSummaryTable';
import { EmployeeBudgetList } from '@/components/budget/EmployeeBudgetList';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const BudgetPlanning = () => {
  const navigate = useNavigate();
  const [fiscalYear, setFiscalYear] = useState(2026);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  const { data: userData } = useCurrentUserRole();
  const { data: summary, isLoading: summaryLoading } = useBudgetSummary(
    userData?.unitId || null,
    fiscalYear
  );
  const { data: submissionData } = useSubmissionStatus(
    userData?.unitId || null,
    fiscalYear
  );

  // Buscar funcionários da unidade
  const { data: employees } = useQuery({
    queryKey: ['unit-employees', userData?.unitId],
    queryFn: async () => {
      if (!userData?.unitId) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, job_title, salary')
        .eq('unit_id', userData.unitId)
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.unitId,
  });

  const handleSubmit = async () => {
    if (!userData?.unitId || !userData?.userId) {
      toast.error('Erro ao identificar unidade ou usuário');
      return;
    }

    try {
      // Verificar se já existe uma submissão
      const { data: existing } = await supabase
        .from('budget_submissions')
        .select('id')
        .eq('unit_id', userData.unitId)
        .eq('fiscal_year', fiscalYear)
        .single();

      if (existing) {
        // Atualizar submissão existente
        const { error } = await supabase
          .from('budget_submissions')
          .update({
            status: 'submitted',
            submitted_at: new Date().toISOString(),
            submitted_by: userData.userId,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Criar nova submissão
        const { error } = await supabase
          .from('budget_submissions')
          .insert({
            unit_id: userData.unitId,
            fiscal_year: fiscalYear,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
            submitted_by: userData.userId,
          });

        if (error) throw error;
      }

      toast.success('Orçamento submetido para aprovação!');
    } catch (error) {
      console.error('Erro ao submeter orçamento:', error);
      toast.error('Erro ao submeter orçamento');
    }
  };

  const getStatusBadge = () => {
    const status = submissionData?.status || 'draft';
    
    const badges = {
      draft: <Badge variant="secondary">📝 Rascunho</Badge>,
      submitted: <Badge variant="default">✅ Submetido</Badge>,
      approved: <Badge className="bg-green-600">🔒 Aprovado</Badge>,
      rejected: <Badge variant="destructive">❌ Rejeitado</Badge>,
    };

    return badges[status as keyof typeof badges] || badges.draft;
  };

  const canEdit = submissionData?.status === 'draft' || submissionData?.status === 'rejected' || !submissionData?.status;

  return (
    <div className="h-[calc(100vh-8rem)] overflow-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Planejamento de Orçamento</h1>
          <p className="text-muted-foreground">
            Gerencie o orçamento anual planejando mudanças individuais para cada funcionário
          </p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-6 mb-6">
        <BudgetPlanningFilterPanel
          fiscalYear={fiscalYear}
          onFiscalYearChange={setFiscalYear}
        />

        <div className="space-y-6">
          <BudgetSummaryTable
            monthlyTotals={summary?.monthlyTotals || []}
            yearTotal={summary?.yearTotal || 0}
            avgHeadcount={summary?.avgHeadcount || 0}
            isLoading={summaryLoading}
          />

          <EmployeeBudgetList
            employees={employees || []}
            onEditEmployee={(id) => setSelectedEmployeeId(id)}
            onAddPlannedHire={() => {
              toast.info('Funcionalidade em desenvolvimento');
            }}
          />

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate('/employees')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            {canEdit && (
              <Button onClick={handleSubmit}>
                <Send className="w-4 h-4 mr-2" />
                Submeter para Aprovação
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetPlanning;
