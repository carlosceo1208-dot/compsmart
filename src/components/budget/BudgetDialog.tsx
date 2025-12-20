import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompanyContext } from '@/contexts/CompanyContext';

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetData?: {
    id: string;
    fiscal_year: number;
    month: number;
    unit_id: string | null;
    budgeted_salary: number;
    budgeted_headcount: number;
  };
  mode: 'create' | 'edit';
}

const months = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export const BudgetDialog = ({ open, onOpenChange, budgetData, mode }: BudgetDialogProps) => {
  const queryClient = useQueryClient();
  const { activeCompanyId } = useCompanyContext();
  const [formData, setFormData] = useState({
    fiscal_year: currentYear,
    month: new Date().getMonth() + 1,
    unit_id: null as string | null,
    budgeted_salary: 0,
    budgeted_headcount: 0,
  });

  useEffect(() => {
    if (budgetData && mode === 'edit') {
      setFormData({
        fiscal_year: budgetData.fiscal_year,
        month: budgetData.month,
        unit_id: budgetData.unit_id,
        budgeted_salary: budgetData.budgeted_salary,
        budgeted_headcount: budgetData.budgeted_headcount,
      });
    } else if (mode === 'create') {
      setFormData({
        fiscal_year: currentYear,
        month: new Date().getMonth() + 1,
        unit_id: null,
        budgeted_salary: 0,
        budgeted_headcount: 0,
      });
    }
  }, [budgetData, mode, open]);

  const { data: units } = useQuery({
    queryKey: ['organizational-units', activeCompanyId],
    queryFn: async () => {
      let query = supabase
        .from('organizational_structure')
        .select('id, description, type, root_company_id')
        .in('type', ['area', 'department', 'sector', 'project']);
      
      // Filtrar por empresa ativa (CORREÇÃO DE ISOLAMENTO)
      if (activeCompanyId) {
        query = query.or(`root_company_id.eq.${activeCompanyId},id.eq.${activeCompanyId}`);
      }
      
      const { data, error } = await query.order('description');
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (formData.budgeted_salary <= 0 || formData.budgeted_headcount <= 0) {
        throw new Error('Valores devem ser maiores que zero');
      }

      if (mode === 'edit' && budgetData) {
        const { error } = await supabase
          .from('budget')
          .update({
            fiscal_year: formData.fiscal_year,
            month: formData.month,
            unit_id: formData.unit_id,
            budgeted_salary: formData.budgeted_salary,
            budgeted_headcount: formData.budgeted_headcount,
          })
          .eq('id', budgetData.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('budget')
          .insert({
            fiscal_year: formData.fiscal_year,
            month: formData.month,
            unit_id: formData.unit_id,
            budgeted_salary: formData.budgeted_salary,
            budgeted_headcount: formData.budgeted_headcount,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['kpi-budget'] });
      toast.success(mode === 'edit' ? 'Orçamento atualizado' : 'Orçamento cadastrado');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Editar Orçamento' : 'Novo Orçamento'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Ano Fiscal</Label>
            <Select
              value={formData.fiscal_year.toString()}
              onValueChange={(value) => setFormData({ ...formData, fiscal_year: parseInt(value) })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Mês</Label>
            <Select
              value={formData.month.toString()}
              onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Unidade Organizacional</Label>
            <Select
              value={formData.unit_id || 'company'}
              onValueChange={(value) => setFormData({ ...formData, unit_id: value === 'company' ? null : value })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="company">Total da Empresa</SelectItem>
                {units?.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Orçamento de Salários (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.budgeted_salary}
              onChange={(e) => setFormData({ ...formData, budgeted_salary: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div>
            <Label>Orçamento de Headcount</Label>
            <Input
              type="number"
              value={formData.budgeted_headcount}
              onChange={(e) => setFormData({ ...formData, budgeted_headcount: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
