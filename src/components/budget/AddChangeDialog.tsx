import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string | null;
  employeeName: string;
  month: number | null;
  fiscalYear: number;
  onSave: () => void;
}

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const changeTypes = [
  { value: 'merit', label: '🎯 Aumento por Mérito', needsPercentage: true },
  { value: 'promotion', label: '🚀 Promoção', needsJobTitle: true },
  { value: 'collective', label: '📈 Acordo Coletivo', needsPercentage: true },
  { value: 'planned_termination', label: '❌ Demissão Planejada', needsNothing: true },
  { value: 'transfer_out', label: '🔄 Transferência', needsUnit: true },
  { value: 'manual', label: '✏️ Ajuste Manual', needsManual: true },
];

export const AddChangeDialog = ({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  month,
  fiscalYear,
  onSave,
}: AddChangeDialogProps) => {
  const queryClient = useQueryClient();
  const [changeType, setChangeType] = useState('merit');
  const [percentage, setPercentage] = useState('');
  const [newJobTitleId, setNewJobTitleId] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [newUnitId, setNewUnitId] = useState('');
  const [manualSalary, setManualSalary] = useState('');
  const [justification, setJustification] = useState('');
  const [warning, setWarning] = useState('');

  // Buscar dados atuais do funcionário
  const { data: currentData } = useQuery({
    queryKey: ['employee-current-data', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          salary,
          variable_salary,
          benefits_value,
          job_title_id,
          grade,
          unit_id,
          job_titles (
            id,
            title,
            salary_range_id,
            salary_ranges (
              min_value,
              median_value,
              max_value
            )
          )
        `)
        .eq('id', employeeId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!employeeId && open,
  });

  // Buscar cargos disponíveis
  const { data: jobTitles } = useQuery({
    queryKey: ['job-titles-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_titles')
        .select('id, title, grade')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      return data || [];
    },
    enabled: open && changeType === 'promotion',
  });

  // Buscar unidades organizacionais
  const { data: units } = useQuery({
    queryKey: ['org-units-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizational_structure')
        .select('id, code, description')
        .in('type', ['area', 'department', 'sector', 'project'])
        .order('code');

      if (error) throw error;
      return data || [];
    },
    enabled: open && changeType === 'transfer_out',
  });

  // Resetar campos ao mudar tipo
  useEffect(() => {
    setPercentage('');
    setNewJobTitleId('');
    setNewGrade('');
    setNewUnitId('');
    setManualSalary('');
    setWarning('');
  }, [changeType]);

  // Validar faixa salarial ao alterar valores
  useEffect(() => {
    if (!currentData?.job_titles?.salary_ranges) return;

    const range = currentData.job_titles.salary_ranges;
    let projectedSalary = currentData.salary;

    if (changeType === 'merit' || changeType === 'collective') {
      const pct = parseFloat(percentage);
      if (!isNaN(pct)) {
        projectedSalary = currentData.salary * (1 + pct / 100);
      }
    } else if (changeType === 'manual') {
      const manual = parseFloat(manualSalary);
      if (!isNaN(manual)) {
        projectedSalary = manual;
      }
    }

    if (projectedSalary < range.min_value) {
      setWarning(`⚠️ Salário ficará abaixo do mínimo da faixa (R$ ${range.min_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    } else if (projectedSalary > range.max_value) {
      setWarning(`⚠️ Salário ficará acima do máximo da faixa (R$ ${range.max_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    } else {
      setWarning('');
    }
  }, [changeType, percentage, manualSalary, currentData]);

  const handleSave = async () => {
    if (!employeeId || !month || !currentData) {
      toast.error('Dados incompletos');
      return;
    }

    try {
      let projectedSalary = currentData.salary;
      let projectedVariable = currentData.variable_salary;
      let projectedBenefits = currentData.benefits_value;
      let projectedJobTitleId = currentData.job_title_id;
      let projectedGrade = currentData.grade;
      let projectedUnitId = currentData.unit_id;

      // Calcular valores baseado no tipo de mudança
      switch (changeType) {
        case 'merit':
        case 'collective':
          const pct = parseFloat(percentage);
          if (isNaN(pct)) {
            toast.error('Percentual inválido');
            return;
          }
          projectedSalary = currentData.salary * (1 + pct / 100);
          projectedVariable = currentData.variable_salary * (1 + pct / 100);
          break;

        case 'promotion':
          if (!newJobTitleId || !newGrade) {
            toast.error('Selecione o novo cargo e grade');
            return;
          }
          projectedJobTitleId = newJobTitleId;
          projectedGrade = newGrade;
          // Buscar faixa do novo cargo
          const { data: newJobData } = await supabase
            .from('job_titles')
            .select('salary_ranges (median_value)')
            .eq('id', newJobTitleId)
            .single();
          
          if (newJobData?.salary_ranges) {
            projectedSalary = newJobData.salary_ranges.median_value;
          }
          break;

        case 'transfer_out':
          if (!newUnitId) {
            toast.error('Selecione a nova unidade');
            return;
          }
          projectedUnitId = newUnitId;
          break;

        case 'manual':
          const manual = parseFloat(manualSalary);
          if (isNaN(manual)) {
            toast.error('Salário inválido');
            return;
          }
          projectedSalary = manual;
          break;

        case 'planned_termination':
          // Não altera valores
          break;
      }

      // Buscar se já existe projeção para este mês
      const { data: existing } = await supabase
        .from('budget_employee_projections')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('fiscal_year', fiscalYear)
        .eq('month', month)
        .maybeSingle();

      const payload = {
        employee_id: employeeId,
        fiscal_year: fiscalYear,
        month,
        projected_fixed_salary: projectedSalary,
        projected_variable_salary: projectedVariable,
        projected_benefits: projectedBenefits,
        projected_job_title_id: projectedJobTitleId,
        projected_grade: projectedGrade,
        projected_unit_id: projectedUnitId,
        change_type: changeType,
        justification,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      };

      if (existing) {
        const { error } = await supabase
          .from('budget_employee_projections')
          .update(payload)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('budget_employee_projections')
          .insert(payload);

        if (error) throw error;
      }

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['budget-projections'] });
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
      queryClient.invalidateQueries({ queryKey: ['unit-employees'] });

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar mudança:', error);
      toast.error('Erro ao salvar mudança');
    }
  };

  const selectedType = changeTypes.find(t => t.value === changeType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Adicionar Mudança - {employeeName} ({month ? monthNames[month - 1] : ''})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Tipo de Mudança</Label>
            <Select value={changeType} onValueChange={setChangeType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {changeTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedType?.needsPercentage && (
            <div>
              <Label>Percentual de Aumento (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="Ex: 5.5"
              />
              {currentData && percentage && (
                <p className="text-sm text-muted-foreground mt-1">
                  Novo salário: R$ {(currentData.salary * (1 + parseFloat(percentage) / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
          )}

          {selectedType?.needsJobTitle && (
            <>
              <div>
                <Label>Novo Cargo</Label>
                <Select value={newJobTitleId} onValueChange={setNewJobTitleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTitles?.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title} (Grade {job.grade})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nova Grade</Label>
                <Input
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  placeholder="Ex: S3"
                />
              </div>
            </>
          )}

          {selectedType?.needsUnit && (
            <div>
              <Label>Nova Unidade</Label>
              <Select value={newUnitId} onValueChange={setNewUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {units?.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.code} - {unit.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedType?.needsManual && (
            <div>
              <Label>Novo Salário (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={manualSalary}
                onChange={(e) => setManualSalary(e.target.value)}
                placeholder="Ex: 5000.00"
              />
            </div>
          )}

          <div>
            <Label>Justificativa</Label>
            <Textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Descreva o motivo desta mudança..."
              rows={3}
            />
          </div>

          {warning && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Mudança
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
