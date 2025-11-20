import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Loader2, TrendingUp, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';

interface Props {
  plannedHireId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fiscalYear: number;
}

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const EditPlannedHireDialog = ({ plannedHireId, open, onOpenChange, fiscalYear }: Props) => {
  const queryClient = useQueryClient();
  const [jobTitleId, setJobTitleId] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [fixedSalary, setFixedSalary] = useState('');
  const [variableSalary, setVariableSalary] = useState('');
  const [benefits, setBenefits] = useState('');
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [salaryWarning, setSalaryWarning] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [plannedEmployeeName, setPlannedEmployeeName] = useState('');

  // Carregar dados da contratação planejada
  const { data: hireData, isLoading } = useQuery({
    queryKey: ['planned-hire-detail', plannedHireId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_employee_projections')
        .select('*, projected_job_title:job_titles(id, title, code, grade)')
        .eq('id', plannedHireId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: open && !!plannedHireId,
  });

  // Carregar job titles ativos
  const { data: jobTitles } = useQuery({
    queryKey: ['active-job-titles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_titles')
        .select('id, title, code, grade, salary_range_id, salary_ranges(min_value, max_value, median_value)')
        .eq('is_active', true)
        .order('title');
      
      if (error) throw error;
      return data;
    },
  });

  // Preencher formulário quando dados carregarem
  useEffect(() => {
    if (hireData) {
      setJobTitleId(hireData.projected_job_title_id || '');
      setStartMonth(hireData.month.toString());
      setFixedSalary(hireData.projected_fixed_salary.toString());
      setVariableSalary(hireData.projected_variable_salary?.toString() || '');
      setBenefits(hireData.projected_benefits?.toString() || '');
      setJustification(hireData.justification || '');
      setPlannedEmployeeName(hireData.planned_employee_name || '');
    }
  }, [hireData]);

  const selectedJob = jobTitles?.find(j => j.id === jobTitleId);

  // Validar salário em tempo real
  useEffect(() => {
    if (fixedSalary && selectedJob?.salary_ranges) {
      const salary = parseFloat(fixedSalary);
      const range = selectedJob.salary_ranges;
      
      if (salary < range.min_value) {
        setSalaryWarning(`⚠️ Salário abaixo da faixa mínima (${formatCurrency(range.min_value)})`);
      } else if (salary > range.max_value) {
        setSalaryWarning(`⚠️ Salário acima da faixa máxima (${formatCurrency(range.max_value)})`);
      } else {
        setSalaryWarning('');
      }
    } else {
      setSalaryWarning('');
    }
  }, [fixedSalary, selectedJob]);

  const handleUpdate = async () => {
    if (!jobTitleId || !startMonth || !fixedSalary || !justification.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!hireData) return;

    setIsSubmitting(true);
    try {
      const jobTitle = jobTitles?.find(j => j.id === jobTitleId);
      const monthStart = parseInt(startMonth);
      const newPlannedEmployeeName = `Contratação ${jobTitle?.title} (${monthNames[monthStart - 1]}/${fiscalYear})`;

      // Deletar registros antigos (todos com mesmo planned_employee_name)
      await supabase
        .from('budget_employee_projections')
        .delete()
        .eq('planned_employee_name', plannedEmployeeName)
        .eq('fiscal_year', fiscalYear);

      // Criar novos registros
      const records = [];
      for (let month = monthStart; month <= 12; month++) {
        records.push({
          fiscal_year: fiscalYear,
          month,
          employee_id: null,
          is_planned_hire: true,
          planned_employee_name: newPlannedEmployeeName,
          projected_job_title_id: jobTitleId,
          projected_grade: jobTitle?.grade,
          projected_unit_id: hireData.projected_unit_id,
          projected_fixed_salary: parseFloat(fixedSalary),
          projected_variable_salary: variableSalary ? parseFloat(variableSalary) : 0,
          projected_benefits: benefits ? parseFloat(benefits) : 0,
          justification,
          change_type: null,
          created_by: hireData.created_by,
        });
      }

      const { error } = await supabase
        .from('budget_employee_projections')
        .insert(records);

      if (error) throw error;

      toast.success('Contratação atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['unit-employees'] });
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar contratação:', error);
      toast.error('Erro ao atualizar contratação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!hireData) return;

    setIsSubmitting(true);
    try {
      // Deletar todos os registros da contratação
      const { error } = await supabase
        .from('budget_employee_projections')
        .delete()
        .eq('planned_employee_name', plannedEmployeeName)
        .eq('fiscal_year', fiscalYear);

      if (error) throw error;

      toast.success('Contratação removida com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['unit-employees'] });
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
      setShowDeleteDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao remover contratação:', error);
      toast.error('Erro ao remover contratação');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const monthsToWork = startMonth ? 12 - parseInt(startMonth) + 1 : 0;
  const totalImpact = monthsToWork * (
    parseFloat(fixedSalary || '0') + 
    parseFloat(variableSalary || '0') + 
    parseFloat(benefits || '0')
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">✏️ Editar Contratação Planejada</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {hireData?.planned_employee_name}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Cargo */}
            <div className="space-y-2">
              <Label htmlFor="job_title">
                Cargo <span className="text-destructive">*</span>
              </Label>
              <Select value={jobTitleId} onValueChange={setJobTitleId}>
                <SelectTrigger id="job_title">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  {jobTitles?.map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.code} - {job.title} ({job.grade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grade (readonly) */}
            {selectedJob && (
              <div className="space-y-2">
                <Label>Grade</Label>
                <Input value={selectedJob.grade} disabled className="bg-muted" />
              </div>
            )}

            {/* Mês de Contratação */}
            <div className="space-y-2">
              <Label htmlFor="start_month">
                Mês de Contratação <span className="text-destructive">*</span>
              </Label>
              <Select value={startMonth} onValueChange={setStartMonth}>
                <SelectTrigger id="start_month">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((name, idx) => (
                    <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                      {name}/{fiscalYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Salário Fixo */}
            <div className="space-y-2">
              <Label htmlFor="fixed_salary">
                Salário Fixo Mensal <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fixed_salary"
                type="number"
                step="0.01"
                min="0"
                value={fixedSalary}
                onChange={(e) => setFixedSalary(e.target.value)}
              />
              {salaryWarning && (
                <Alert variant="default" className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{salaryWarning}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Salário Variável */}
            <div className="space-y-2">
              <Label htmlFor="variable_salary">Salário Variável Mensal (opcional)</Label>
              <Input
                id="variable_salary"
                type="number"
                step="0.01"
                min="0"
                value={variableSalary}
                onChange={(e) => setVariableSalary(e.target.value)}
              />
            </div>

            {/* Benefícios */}
            <div className="space-y-2">
              <Label htmlFor="benefits">Benefícios Mensais (opcional)</Label>
              <Input
                id="benefits"
                type="number"
                step="0.01"
                min="0"
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
              />
            </div>

            {/* Justificativa */}
            <div className="space-y-2">
              <Label htmlFor="justification">
                Justificativa <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={3}
              />
            </div>

            {/* Card de Impacto */}
            {startMonth && fixedSalary && (
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Impacto no Orçamento</span>
                </div>
                <p className="text-sm">
                  {monthsToWork} meses × {formatCurrency(parseFloat(fixedSalary) + parseFloat(variableSalary || '0') + parseFloat(benefits || '0'))} = 
                  <span className="font-bold text-lg ml-2">{formatCurrency(totalImpact)}</span>
                </p>
              </Card>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remover Contratação
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta contratação planejada?
              Esta ação não pode ser desfeita e todos os registros mensais serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                'Remover'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
