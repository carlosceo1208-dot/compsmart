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
import { EmployeeBudgetDialog } from '@/components/budget/EmployeeBudgetDialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const BudgetPlanning = () => {
  const navigate = useNavigate();
  const [fiscalYear, setFiscalYear] = useState(2026);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  
  const { data: userData } = useCurrentUserRole();
  
  // Definir unidade selecionada baseado no role
  useState(() => {
    if (userData?.isAdmin || userData?.isHR) {
      setSelectedUnitId(null); // Empresa toda
    } else {
      setSelectedUnitId(userData?.unitId || null);
    }
  });

  const { data: summary, isLoading: summaryLoading } = useBudgetSummary(
    selectedUnitId,
    fiscalYear
  );
  const { data: submissionData } = useSubmissionStatus(
    selectedUnitId,
    fiscalYear
  );

  // Buscar funcionários da unidade
  const { data: employees } = useQuery({
    queryKey: ['unit-employees', selectedUnitId, fiscalYear],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, full_name, job_title, salary')
        .eq('status', 'active')
        .order('full_name');

      if (selectedUnitId) {
        query = query.eq('unit_id', selectedUnitId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Contar mudanças planejadas por funcionário
      const employeeIds = data?.map(e => e.id) || [];
      const { data: changes } = await supabase
        .from('budget_employee_projections')
        .select('employee_id')
        .eq('fiscal_year', fiscalYear)
        .in('employee_id', employeeIds)
        .not('change_type', 'is', null);

      const changeCounts = new Map<string, number>();
      changes?.forEach(c => {
        changeCounts.set(c.employee_id, (changeCounts.get(c.employee_id) || 0) + 1);
      });

      return data?.map(emp => ({
        ...emp,
        changeCount: changeCounts.get(emp.id) || 0,
      })) || [];
    },
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

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 mb-6">
        <BudgetPlanningFilterPanel
          fiscalYear={fiscalYear}
          onFiscalYearChange={setFiscalYear}
          selectedUnitId={selectedUnitId}
          onUnitChange={setSelectedUnitId}
          isAdmin={userData?.isAdmin || false}
          isHR={userData?.isHR || false}
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

          {selectedEmployeeId && (
            <EmployeeBudgetDialog
              employeeId={selectedEmployeeId}
              employeeName={employees?.find(e => e.id === selectedEmployeeId)?.full_name || ''}
              fiscalYear={fiscalYear}
              open={!!selectedEmployeeId}
              onOpenChange={(open) => !open && setSelectedEmployeeId(null)}
            />
          )}

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
