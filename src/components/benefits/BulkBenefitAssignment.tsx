import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { FilterState } from '@/hooks/useEmployeeFilters';

interface BulkBenefitAssignmentProps {
  filters: FilterState;
  employeeCount: number;
}

export const BulkBenefitAssignment = ({ filters, employeeCount }: BulkBenefitAssignmentProps) => {
  const [open, setOpen] = useState(false);
  const [selectedBenefitId, setSelectedBenefitId] = useState('');
  const queryClient = useQueryClient();

  const { data: benefits } = useQuery({
    queryKey: ['benefits-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('benefits')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const selectedBenefit = benefits?.find(b => b.id === selectedBenefitId);

  const assignMutation = useMutation({
    mutationFn: async () => {
      // Buscar funcionários com os filtros aplicados
      let query = supabase
        .from('profiles')
        .select('id')
        .eq('status', 'active');

      if (filters.search.trim()) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,employee_number.ilike.%${filters.search}%`
        );
      }

      if (filters.unit_id.length > 0) {
        query = query.in('unit_id', filters.unit_id);
      }

      if (filters.job_title) {
        query = query.eq('job_title', filters.job_title);
      }

      if (filters.grade.length > 0) {
        query = query.in('grade', filters.grade);
      }

      const { data: employees, error: employeesError } = await query;
      if (employeesError) throw employeesError;

      if (!employees || employees.length === 0) {
        throw new Error('Nenhum funcionário encontrado com os filtros aplicados');
      }

      // Aplicar filtro de benefícios se necessário
      let targetEmployees = employees;
      if (filters.has_benefits !== 'all') {
        const { data: existingBenefits } = await supabase
          .from('employee_benefits')
          .select('employee_id')
          .in('employee_id', employees.map(e => e.id))
          .eq('is_active', true);

        const employeesWithBenefits = new Set(existingBenefits?.map(b => b.employee_id));

        if (filters.has_benefits === 'with') {
          targetEmployees = employees.filter(e => employeesWithBenefits.has(e.id));
        } else {
          targetEmployees = employees.filter(e => !employeesWithBenefits.has(e.id));
        }
      }

      if (targetEmployees.length === 0) {
        throw new Error('Nenhum funcionário elegível encontrado');
      }

      // Verificar se já possuem este benefício
      const { data: existingAssignments } = await supabase
        .from('employee_benefits')
        .select('employee_id')
        .eq('benefit_id', selectedBenefitId)
        .eq('is_active', true)
        .in('employee_id', targetEmployees.map(e => e.id));

      const alreadyAssigned = new Set(existingAssignments?.map(a => a.employee_id));
      const toAssign = targetEmployees.filter(e => !alreadyAssigned.has(e.id));

      if (toAssign.length === 0) {
        throw new Error('Todos os funcionários já possuem este benefício');
      }

      // Criar atribuições
      const assignments = toAssign.map(employee => ({
        employee_id: employee.id,
        benefit_id: selectedBenefitId,
        company_contribution_value: selectedBenefit?.value_per_employee || 0,
        employee_contribution_type: selectedBenefit?.default_employee_contribution_type || 'none',
        employee_contribution_value: selectedBenefit?.default_employee_contribution_value || 0,
        is_active: true,
        start_date: new Date().toISOString().split('T')[0],
      }));

      const { error: insertError } = await supabase
        .from('employee_benefits')
        .insert(assignments);

      if (insertError) throw insertError;

      return { count: toAssign.length, skipped: alreadyAssigned.size };
    },
    onSuccess: ({ count, skipped }) => {
      queryClient.invalidateQueries({ queryKey: ['employees-filtered'] });
      queryClient.invalidateQueries({ queryKey: ['all-employee-benefits'] });
      queryClient.invalidateQueries({ queryKey: ['benefits-kpi'] });
      
      toast.success(
        `Benefício atribuído a ${count} funcionário(s)!${skipped > 0 ? ` (${skipped} já possuíam)` : ''}`
      );
      setOpen(false);
      setSelectedBenefitId('');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atribuir benefícios', {
        description: error.message,
      });
    },
  });

  const handleAssign = () => {
    if (!selectedBenefitId) {
      toast.error('Selecione um benefício');
      return;
    }
    assignMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Atribuição em Massa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Atribuição em Massa de Benefícios</DialogTitle>
          <DialogDescription>
            Atribua um benefício a múltiplos funcionários de uma vez
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo dos Filtros */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{employeeCount}</strong> funcionário(s) serão considerados com base nos filtros ativos.
            </AlertDescription>
          </Alert>

          {/* Filtros Aplicados */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Filtros Ativos:</Label>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary">Busca: "{filters.search}"</Badge>
              )}
              {filters.unit_id.length > 0 && (
                <Badge variant="secondary">{filters.unit_id.length} unidade(s)</Badge>
              )}
              {filters.job_title && (
                <Badge variant="secondary">Cargo: {filters.job_title}</Badge>
              )}
              {filters.grade.length > 0 && (
                <Badge variant="secondary">{filters.grade.length} grade(s)</Badge>
              )}
              {filters.has_benefits !== 'all' && (
                <Badge variant="secondary">
                  {filters.has_benefits === 'with' ? 'Com benefícios' : 'Sem benefícios'}
                </Badge>
              )}
              {employeeCount > 0 && !filters.search && filters.unit_id.length === 0 && 
               !filters.job_title && filters.grade.length === 0 && filters.has_benefits === 'all' && (
                <Badge variant="secondary">Todos os funcionários ativos</Badge>
              )}
            </div>
          </div>

          {/* Seleção de Benefício */}
          <div className="space-y-2">
            <Label htmlFor="benefit">Selecione o Benefício</Label>
            <Select value={selectedBenefitId} onValueChange={setSelectedBenefitId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um benefício..." />
              </SelectTrigger>
              <SelectContent>
                {benefits?.map((benefit) => (
                  <SelectItem key={benefit.id} value={benefit.id}>
                    {benefit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview do Benefício Selecionado */}
          {selectedBenefit && (
            <Alert className="bg-primary/5 border-primary/20">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold">{selectedBenefit.name}</p>
                  <p className="text-sm">
                    Valor: R$ {selectedBenefit.value_per_employee?.toFixed(2)}
                  </p>
                  {selectedBenefit.default_employee_contribution_type !== 'none' && (
                    <p className="text-sm">
                      Co-participação: {selectedBenefit.default_employee_contribution_type === 'percentage'
                        ? `${selectedBenefit.default_employee_contribution_value}%`
                        : `R$ ${selectedBenefit.default_employee_contribution_value}`
                      }
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedBenefitId || assignMutation.isPending}
          >
            {assignMutation.isPending ? 'Atribuindo...' : `Atribuir a ${employeeCount} Funcionário(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
