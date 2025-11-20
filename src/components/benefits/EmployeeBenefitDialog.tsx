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
import { Plus, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmployeeBenefitDialogProps {
  employeeId: string;
  trigger?: React.ReactNode;
}

export const EmployeeBenefitDialog = ({ employeeId, trigger }: EmployeeBenefitDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    benefit_id: '',
    company_contribution_value: 0,
    employee_contribution_type: 'fixed' as 'fixed' | 'percentage',
    employee_contribution_value: 0,
    is_active: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
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
  
  const calculatedEmployeeValue = formData.employee_contribution_type === 'percentage'
    ? (formData.company_contribution_value * formData.employee_contribution_value) / 100
    : formData.employee_contribution_value;

  useEffect(() => {
    if (selectedBenefit) {
      // Pre-fill with benefit's default values
      setFormData(prev => ({
        ...prev,
        company_contribution_value: selectedBenefit.value_per_employee,
        employee_contribution_type: (selectedBenefit.default_employee_contribution_type === 'none' 
          ? 'fixed' 
          : selectedBenefit.default_employee_contribution_type) as 'fixed' | 'percentage',
        employee_contribution_value: selectedBenefit.default_employee_contribution_value || 0,
      }));
    }
  }, [selectedBenefit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('employee_benefits')
        .insert([{
          employee_id: employeeId,
          ...formData,
          end_date: formData.end_date || null,
        }]);

      if (error) throw error;
      
      toast.success('Benefício atribuído com sucesso');
      queryClient.invalidateQueries({ queryKey: ['employee-benefits', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['kpi-benefits'] });
      setOpen(false);
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
                {benefits?.map((benefit) => (
                  <SelectItem key={benefit.id} value={benefit.id}>
                    {benefit.name} - R$ {benefit.value_per_employee.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                    ? `${formData.employee_contribution_value}% de R$ ${formData.company_contribution_value.toFixed(2)} = R$ ${calculatedEmployeeValue.toFixed(2)}`
                    : `R$ ${calculatedEmployeeValue.toFixed(2)}`
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
