import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil } from 'lucide-react';

interface Benefit {
  id: string;
  name: string;
  description: string | null;
  benefit_type: string;
  value_per_employee: number;
  is_active: boolean;
}

interface BenefitDialogProps {
  benefit?: Benefit;
  trigger?: React.ReactNode;
}

export const BenefitDialog = ({ benefit, trigger }: BenefitDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: benefit?.name || '',
    description: benefit?.description || '',
    benefit_type: benefit?.benefit_type || 'health',
    value_per_employee: benefit?.value_per_employee || 0,
    is_active: benefit?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (benefit) {
        const { error } = await supabase
          .from('benefits')
          .update(formData)
          .eq('id', benefit.id);

        if (error) throw error;
        toast.success('Benefício atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('benefits')
          .insert([formData]);

        if (error) throw error;
        toast.success('Benefício cadastrado com sucesso');
      }

      queryClient.invalidateQueries({ queryKey: ['benefits'] });
      setOpen(false);
    } catch (error) {
      console.error('Error saving benefit:', error);
      toast.error('Erro ao salvar benefício');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            {benefit ? <Pencil className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {benefit ? 'Editar' : 'Novo Benefício'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{benefit ? 'Editar Benefício' : 'Novo Benefício'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Benefício</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Plano de Saúde"
              required
            />
          </div>

          <div>
            <Label htmlFor="benefit_type">Tipo de Benefício</Label>
            <Select
              value={formData.benefit_type}
              onValueChange={(value) => setFormData({ ...formData, benefit_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="health">Saúde</SelectItem>
                <SelectItem value="dental">Odontológico</SelectItem>
                <SelectItem value="life_insurance">Seguro de Vida</SelectItem>
                <SelectItem value="meal_voucher">Vale Refeição</SelectItem>
                <SelectItem value="food_voucher">Vale Alimentação</SelectItem>
                <SelectItem value="transportation">Vale Transporte</SelectItem>
                <SelectItem value="education">Educação</SelectItem>
                <SelectItem value="gym">Academia</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="value_per_employee">Valor Base por Funcionário (R$)</Label>
            <Input
              id="value_per_employee"
              type="number"
              step="0.01"
              min="0"
              value={formData.value_per_employee}
              onChange={(e) => setFormData({ ...formData, value_per_employee: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalhes sobre o benefício..."
              rows={3}
            />
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
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
