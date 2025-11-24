import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmployeeAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment?: any;
  employeeId: string;
  programId: string;
  onSuccess: () => void;
}

export const EmployeeAssignmentDialog = ({
  open,
  onOpenChange,
  assignment,
  employeeId,
  programId,
  onSuccess,
}: EmployeeAssignmentDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    target_value: '',
    actual_value: '',
    vesting_start_date: undefined as Date | undefined,
    is_active: true,
    notes: '',
  });

  useEffect(() => {
    if (assignment) {
      setFormData({
        target_value: assignment.target_value?.toString() || '',
        actual_value: assignment.actual_value?.toString() || '',
        vesting_start_date: assignment.vesting_start_date ? new Date(assignment.vesting_start_date) : undefined,
        is_active: assignment.is_active ?? true,
        notes: assignment.notes || '',
      });
    } else {
      setFormData({
        target_value: '',
        actual_value: '',
        vesting_start_date: undefined,
        is_active: true,
        notes: '',
      });
    }
  }, [assignment, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        employee_id: employeeId,
        program_id: programId,
        target_value: formData.target_value ? parseFloat(formData.target_value) : 0,
        actual_value: formData.actual_value ? parseFloat(formData.actual_value) : 0,
        vesting_start_date: formData.vesting_start_date?.toISOString().split('T')[0] || null,
        is_active: formData.is_active,
        notes: formData.notes,
      };

      if (assignment) {
        const { error } = await supabase
          .from('employee_incentive_assignments')
          .update(dataToSave)
          .eq('id', assignment.id);

        if (error) throw error;
        toast({ title: 'Atribuição atualizada com sucesso!' });
      } else {
        const { error } = await supabase
          .from('employee_incentive_assignments')
          .insert([dataToSave]);

        if (error) throw error;
        toast({ title: 'Incentivo atribuído com sucesso!' });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar atribuição:', error);
      toast({
        title: 'Erro ao salvar atribuição',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {assignment ? 'Editar Atribuição' : 'Atribuir Incentivo'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target_value">Valor-Alvo (R$) *</Label>
            <Input
              id="target_value"
              type="number"
              step="0.01"
              value={formData.target_value}
              onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
              placeholder="Ex: 25000.00"
              required
            />
            <p className="text-xs text-muted-foreground">
              Valor anual esperado do incentivo
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="actual_value">Valor Realizado (R$)</Label>
            <Input
              id="actual_value"
              type="number"
              step="0.01"
              value={formData.actual_value}
              onChange={(e) => setFormData({ ...formData, actual_value: e.target.value })}
              placeholder="Ex: 22500.00"
            />
            <p className="text-xs text-muted-foreground">
              Valor efetivamente pago (opcional)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Data de Início do Vesting</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.vesting_start_date ? (
                    format(formData.vesting_start_date, 'PPP', { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.vesting_start_date}
                  onSelect={(date) => setFormData({ ...formData, vesting_start_date: date })}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionais sobre esta atribuição"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Atribuição ativa</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : assignment ? 'Atualizar' : 'Atribuir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
