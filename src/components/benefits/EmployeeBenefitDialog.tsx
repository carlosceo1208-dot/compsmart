import { useState, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Info, Bus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAutoAssignBenefit } from '@/hooks/useAutoAssignBenefit';
import { useTransportationCalculator } from '@/hooks/useTransportationCalculator';
import { formatCurrency } from '@/lib/formatters';

interface EmployeeBenefitDialogProps {
  employeeId: string;
  trigger?: React.ReactNode;
}

export const EmployeeBenefitDialog = ({ employeeId, trigger }: EmployeeBenefitDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transportationCost, setTransportationCost] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    benefit_id: '',
    company_contribution_value: 0,
    employee_contribution_type: 'fixed' as 'fixed' | 'percentage',
    employee_contribution_value: 0,
    is_active: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    eligibility_rule_id: null as string | null,
  });

  // Buscar dados do funcionário
  const { data: employee } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', employeeId)
        .single();
      if (error) throw error;
      return data;
    },
  });

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

  const selectedBenefit = benefits?.find(b => b.id === formData.benefit_id);
  
  // Verificar elegibilidade automática
  const { data: eligibility, isLoading: checkingEligibility } = useAutoAssignBenefit(
    employeeId,
    formData.benefit_id
  );

  // Calcular Vale Transporte
  const { data: transportationCalc } = useTransportationCalculator(
    employeeId,
    transportationCost
  );

  const calculatedEmployeeValue = formData.employee_contribution_type === 'percentage'
    ? (formData.company_contribution_value * formData.employee_contribution_value) / 100
    : formData.employee_contribution_value;

  // Atribuição automática baseada em elegibilidade
  useEffect(() => {
    if (eligibility?.is_eligible) {
      setFormData(prev => ({
        ...prev,
        company_contribution_value: eligibility.company_value,
        employee_contribution_type: (eligibility.employee_contribution_type === 'none' 
          ? 'fixed' 
          : eligibility.employee_contribution_type) as 'fixed' | 'percentage',
        employee_contribution_value: eligibility.employee_contribution_value,
        eligibility_rule_id: eligibility.rule_id,
      }));
    } else if (eligibility && !eligibility.is_eligible) {
      toast.warning('Funcionário não elegível para este benefício');
    } else if (selectedBenefit && !eligibility) {
      // Fallback para valores padrão se não houver regras
      setFormData(prev => ({
        ...prev,
        company_contribution_value: selectedBenefit.value_per_employee,
        employee_contribution_type: (selectedBenefit.default_employee_contribution_type === 'none' 
          ? 'fixed' 
          : selectedBenefit.default_employee_contribution_type) as 'fixed' | 'percentage',
        employee_contribution_value: selectedBenefit.default_employee_contribution_value || 0,
        eligibility_rule_id: null,
      }));
    }
  }, [eligibility, selectedBenefit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Para Vale Transporte, usar valores calculados
      let finalCompanyValue = formData.company_contribution_value;
      let finalEmployeeValue = formData.employee_contribution_value;

      if (selectedBenefit?.template_type === 'transportation' && transportationCalc) {
        finalCompanyValue = transportationCalc.company_subsidy;
        finalEmployeeValue = transportationCalc.employee_discount;
      }

      const { error } = await supabase
        .from('employee_benefits')
        .insert([{
          employee_id: employeeId,
          benefit_id: formData.benefit_id,
          company_contribution_value: finalCompanyValue,
          employee_contribution_type: formData.employee_contribution_type,
          employee_contribution_value: finalEmployeeValue,
          is_active: formData.is_active,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          eligibility_rule_id: formData.eligibility_rule_id,
        }]);

      if (error) throw error;
      
      toast.success('Benefício atribuído com sucesso');
      queryClient.invalidateQueries({ queryKey: ['employee-benefits', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['kpi-benefits'] });
      setOpen(false);
      setTransportationCost(null);
    } catch (error) {
      console.error('Error assigning benefit:', error);
      toast.error('Erro ao atribuir benefício');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Atribuir Benefício
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Atribuir Benefício ao Funcionário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="benefit_id">Benefício</Label>
            <Select
              value={formData.benefit_id}
              onValueChange={(value) => setFormData({ ...formData, benefit_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um benefício" />
              </SelectTrigger>
              <SelectContent>
                {benefits?.map((benefit: any) => (
                  <SelectItem key={benefit.id} value={benefit.id}>
                    {benefit.name} - {formatCurrency(benefit.value_per_employee)}
                    {benefit.eligibility_type !== 'none' && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({benefit.eligibility_type === 'grade' ? '📊 Por Grade' : '💰 Por Salário'})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {checkingEligibility && (
              <p className="text-sm text-muted-foreground">Verificando elegibilidade...</p>
            )}
            {eligibility?.description && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {eligibility.description}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Vale Transporte - Calculadora Especial */}
          {selectedBenefit?.template_type === 'transportation' && (
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bus className="h-4 w-4" />
                  Cálculo Vale Transporte (Limite 6% do Salário)
                </CardTitle>
                <CardDescription className="text-xs">
                  CLT Art. 458 - Desconto limitado a 6% do salário fixo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="transportation_cost">Custo Mensal do Transporte (R$)</Label>
                  <Input
                    id="transportation_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="200.00"
                    value={transportationCost || ''}
                    onChange={(e) => setTransportationCost(parseFloat(e.target.value) || null)}
                  />
                </div>

                {transportationCalc && employee && (
                  <Alert className="bg-background">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm space-y-1">
                      <div><strong>Salário:</strong> {formatCurrency(employee.salary || 0)}</div>
                      <div><strong>6% do Salário:</strong> {formatCurrency((employee.salary || 0) * 0.06)}</div>
                      <hr className="my-2" />
                      <div className="text-primary">
                        <strong>Desconto Funcionário:</strong> {formatCurrency(transportationCalc.employee_discount)}
                      </div>
                      <div className="text-primary">
                        <strong>Subsídio Empresa:</strong> {formatCurrency(transportationCalc.company_subsidy)}
                      </div>
                      <div className="font-semibold">
                        <strong>Total:</strong> {formatCurrency(transportationCalc.total_cost)}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          <div>
            <Label htmlFor="company_contribution_value">Contribuição da Empresa (R$)</Label>
            <Input
              id="company_contribution_value"
              type="number"
              step="0.01"
              min="0"
              value={formData.company_contribution_value}
              onChange={(e) => setFormData({ ...formData, company_contribution_value: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Participação do Funcionário</Label>
            <RadioGroup
              value={formData.employee_contribution_type}
              onValueChange={(value: 'fixed' | 'percentage') => 
                setFormData({ ...formData, employee_contribution_type: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed" className="font-normal cursor-pointer">
                  Valor Fixo (R$)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="font-normal cursor-pointer">
                  Percentual (%)
                </Label>
              </div>
            </RadioGroup>

            <div>
              <Label htmlFor="employee_contribution_value">
                {formData.employee_contribution_type === 'percentage' ? 'Percentual' : 'Valor'} da Participação
              </Label>
              <Input
                id="employee_contribution_value"
                type="number"
                step={formData.employee_contribution_type === 'percentage' ? '0.01' : '0.01'}
                min="0"
                max={formData.employee_contribution_type === 'percentage' ? '100' : undefined}
                value={formData.employee_contribution_value}
                onChange={(e) => setFormData({ ...formData, employee_contribution_value: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {formData.employee_contribution_value > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  💡 Cálculo: {formData.employee_contribution_type === 'percentage' 
                    ? `${formData.employee_contribution_value}% de ${formatCurrency(formData.company_contribution_value)} = ${formatCurrency(calculatedEmployeeValue)}`
                    : formatCurrency(calculatedEmployeeValue)
                  }
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date">Data de Término (opcional)</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Benefício Ativo</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Atribuindo...' : 'Atribuir'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
