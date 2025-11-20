import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId: string | null;
  fiscalYear: number;
}

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const PlannedHireDialog = ({ open, onOpenChange, unitId, fiscalYear }: Props) => {
  const [jobTitleId, setJobTitleId] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [fixedSalary, setFixedSalary] = useState('');
  const [variableSalary, setVariableSalary] = useState('');
  const [benefits, setBenefits] = useState('');
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [salaryWarning, setSalaryWarning] = useState('');

  const { data: jobTitles, isLoading: loadingJobs } = useQuery({
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

  const { data: userData } = useQuery({
    queryKey: ['current-user-id'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const selectedJob = jobTitles?.find(j => j.id === jobTitleId);

  // Calcular mês atual para validação
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const minMonth = fiscalYear === currentYear ? currentMonth + 1 : 1;

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

  const handleSubmit = async () => {
    if (!jobTitleId || !startMonth || !fixedSalary || !justification.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!unitId || !userData?.id) {
      toast.error('Erro ao identificar unidade ou usuário');
      return;
    }

    const monthStart = parseInt(startMonth);
    if (monthStart < minMonth || monthStart > 12) {
      toast.error(`Mês de contratação deve ser >= ${monthNames[minMonth - 1]}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const jobTitle = jobTitles?.find(j => j.id === jobTitleId);
      const plannedEmployeeName = `Contratação ${jobTitle?.title} (${monthNames[monthStart - 1]}/${fiscalYear})`;

      // Criar registros para cada mês de [startMonth, 12]
      const records = [];
      for (let month = monthStart; month <= 12; month++) {
        records.push({
          fiscal_year: fiscalYear,
          month,
          employee_id: null,
          is_planned_hire: true,
          planned_employee_name: plannedEmployeeName,
          projected_job_title_id: jobTitleId,
          projected_grade: jobTitle?.grade,
          projected_unit_id: unitId,
          projected_fixed_salary: parseFloat(fixedSalary),
          projected_variable_salary: variableSalary ? parseFloat(variableSalary) : 0,
          projected_benefits: benefits ? parseFloat(benefits) : 0,
          justification,
          change_type: null,
          created_by: userData.id,
        });
      }

      const { error } = await supabase
        .from('budget_employee_projections')
        .insert(records);

      if (error) throw error;

      toast.success('Contratação planejada adicionada com sucesso!');
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar contratação planejada:', error);
      toast.error('Erro ao criar contratação planejada');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setJobTitleId('');
    setStartMonth('');
    setFixedSalary('');
    setVariableSalary('');
    setBenefits('');
    setJustification('');
    setSalaryWarning('');
  };

  const monthsToWork = startMonth ? 12 - parseInt(startMonth) + 1 : 0;
  const totalImpact = monthsToWork * (
    parseFloat(fixedSalary || '0') + 
    parseFloat(variableSalary || '0') + 
    parseFloat(benefits || '0')
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">🆕 Nova Contratação Planejada</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Adicione uma nova contratação ao orçamento de {fiscalYear}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cargo */}
          <div className="space-y-2">
            <Label htmlFor="job_title">
              Cargo <span className="text-destructive">*</span>
            </Label>
            <Select value={jobTitleId} onValueChange={setJobTitleId} disabled={loadingJobs}>
              <SelectTrigger id="job_title">
                <SelectValue placeholder={loadingJobs ? "Carregando..." : "Selecione o cargo"} />
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
                {monthNames.map((name, idx) => {
                  const month = idx + 1;
                  const disabled = month < minMonth;
                  return (
                    <SelectItem key={month} value={month.toString()} disabled={disabled}>
                      {name}/{fiscalYear}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {minMonth > 1 && (
              <p className="text-xs text-muted-foreground">
                Contratações devem ser para {monthNames[minMonth - 1]}/{fiscalYear} ou posterior
              </p>
            )}
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
              placeholder="0.00"
            />
            {salaryWarning && (
              <Alert variant="default" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">{salaryWarning}</AlertDescription>
              </Alert>
            )}
            {selectedJob?.salary_ranges && (
              <p className="text-xs text-muted-foreground">
                Faixa salarial: {formatCurrency(selectedJob.salary_ranges.min_value)} - {formatCurrency(selectedJob.salary_ranges.max_value)}
              </p>
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
              placeholder="0.00"
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
              placeholder="0.00"
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
              placeholder="Justifique a necessidade desta contratação..."
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !jobTitleId || !startMonth || !fixedSalary || !justification.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Contratação'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
