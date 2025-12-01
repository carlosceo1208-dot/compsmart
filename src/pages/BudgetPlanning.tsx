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
import { PlannedHireDialog } from '@/components/budget/PlannedHireDialog';
import { EditPlannedHireDialog } from '@/components/budget/EditPlannedHireDialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const BudgetPlanning = () => {
  const navigate = useNavigate();
  const [fiscalYear, setFiscalYear] = useState(2026);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [plannedHireDialogOpen, setPlannedHireDialogOpen] = useState(false);
  const [editPlannedHireId, setEditPlannedHireId] = useState<string | null>(null);
  
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

  // Buscar funcionários da unidade + contratações planejadas
  const { data: employees } = useQuery({
    queryKey: ['unit-employees', selectedUnitId, fiscalYear],
    queryFn: async () => {
      // Funcionários existentes
      let query = supabase
        .from('profiles')
        .select('id, full_name, job_title, salary')
        .eq('status', 'active')
        .order('full_name');

      if (selectedUnitId) {
        query = query.eq('unit_id', selectedUnitId);
      }

      const { data: employeeData, error } = await query;
      if (error) throw error;

      // Contar alterações planejadas por funcionário
      const employeeIds = employeeData?.map(e => e.id) || [];
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

      // Contratações planejadas (buscar primeiro registro de cada)
      let plannedQuery = supabase
        .from('budget_employee_projections')
        .select('id, planned_employee_name, projected_job_title_id, projected_fixed_salary, month, projected_job_title:job_titles(title)')
        .eq('fiscal_year', fiscalYear)
        .eq('is_planned_hire', true)
        .order('month');

      if (selectedUnitId) {
        plannedQuery = plannedQuery.eq('projected_unit_id', selectedUnitId);
      }

      const { data: plannedHires } = await plannedQuery;

      // Agrupar contratações planejadas por nome (cada nome único = 1 contratação)
      const uniqueHires = Array.from(
        new Map(plannedHires?.map(h => [h.planned_employee_name, h]) || []).values()
      );

      // Combinar funcionários + contratações
      const allEmployees = [
        ...(employeeData?.map(emp => ({
          id: emp.id,
          full_name: emp.full_name,
          job_title: emp.job_title,
          salary: emp.salary,
          changeCount: changeCounts.get(emp.id) || 0,
          isPlannedHire: false,
        })) || []),
        ...uniqueHires.map(hire => ({
          id: hire.id,
          full_name: `🆕 ${hire.planned_employee_name}`,
          job_title: hire.projected_job_title?.title,
          salary: hire.projected_fixed_salary,
          changeCount: 0,
          isPlannedHire: true,
        })),
      ];

      return allEmployees;
    },
  });

  const handleSubmit = async () => {
    if (!userData?.unitId || !userData?.userId) {
      toast.error('Erro ao identificar unidade ou usuário');
      return;
    }

    let submissionId: string;

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
        submissionId = existing.id;
      } else {
        // Criar nova submissão
        const { data: newSubmission, error } = await supabase
          .from('budget_submissions')
          .insert({
            unit_id: userData.unitId,
            fiscal_year: fiscalYear,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
            submitted_by: userData.userId,
          })
          .select('id')
          .single();

        if (error) throw error;
        if (!newSubmission) throw new Error('Falha ao criar submissão');
        submissionId = newSubmission.id;
      }

      toast.success('Orçamento submetido para aprovação!');
      
      // Notificar aprovadores por email
      try {
        const { data: unitData } = await supabase
          .from('organizational_structure')
          .select('description')
          .eq('id', userData.unitId)
          .single();

        const { data: userProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', userData.userId)
          .single();

        await supabase.functions.invoke('notify-budget-submission', {
          body: {
            submissionId,
            unitName: unitData?.description || 'Unidade',
            submittedBy: userProfile?.full_name || 'Usuário',
            totalAmount: summary?.yearTotal || 0,
            fiscalYear: fiscalYear,
          },
        });
        
        console.log('✅ Notificações enviadas aos aprovadores');
        toast.success('📧 Aprovadores foram notificados por email');
      } catch (notifyError) {
        console.error('⚠️ Erro ao enviar notificações (não crítico):', notifyError);
        toast.warning('Orçamento submetido, mas notificação por email falhou');
      }

      navigate('/');
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
            Gerencie o orçamento anual planejando alterações individuais para cada funcionário
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
            onEditEmployee={(id, isPlannedHire) => {
              if (isPlannedHire) {
                setEditPlannedHireId(id);
              } else {
                setSelectedEmployeeId(id);
              }
            }}
            onAddPlannedHire={() => setPlannedHireDialogOpen(true)}
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

          <PlannedHireDialog
            open={plannedHireDialogOpen}
            onOpenChange={setPlannedHireDialogOpen}
            unitId={selectedUnitId}
            fiscalYear={fiscalYear}
          />

          {editPlannedHireId && (
            <EditPlannedHireDialog
              plannedHireId={editPlannedHireId}
              open={!!editPlannedHireId}
              onOpenChange={(open) => !open && setEditPlannedHireId(null)}
              fiscalYear={fiscalYear}
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
