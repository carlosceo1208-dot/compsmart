import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: any;
  onSuccess: () => void;
}

const programSubtypes = {
  short_term: [
    { value: 'plr', label: 'PLR - Participação nos Lucros e Resultados' },
    { value: 'ppr', label: 'PPR - Prêmio de Participação nos Resultados' },
    { value: 'bonus', label: 'Bônus Anual' },
    { value: 'commission', label: 'Comissões de Vendas' },
  ],
  long_term: [
    { value: 'sop', label: 'Stock Options (SOP)' },
    { value: 'rsu', label: 'RSU - Restricted Stock Units' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'phantom', label: 'Phantom Shares' },
    { value: 'deferred', label: 'Bônus Diferido' },
    { value: 'pension', label: 'Previdência Corporativa' },
  ],
};

export const ProgramDialog = ({ open, onOpenChange, program, onSuccess }: ProgramDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    program_type: 'short_term',
    subtype: '',
    target_percentage: '',
    payment_frequency: 'annual',
    vesting_months: '',
    cliff_months: '',
    matching_percentage: '',
    is_active: true,
  });

  useEffect(() => {
    if (program) {
      setFormData({
        name: program.name || '',
        description: program.description || '',
        program_type: program.program_type || 'short_term',
        subtype: program.subtype || '',
        target_percentage: program.target_percentage?.toString() || '',
        payment_frequency: program.payment_frequency || 'annual',
        vesting_months: program.vesting_months?.toString() || '',
        cliff_months: program.cliff_months?.toString() || '',
        matching_percentage: program.matching_percentage?.toString() || '',
        is_active: program.is_active ?? true,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        program_type: 'short_term',
        subtype: '',
        target_percentage: '',
        payment_frequency: 'annual',
        vesting_months: '',
        cliff_months: '',
        matching_percentage: '',
        is_active: true,
      });
    }
  }, [program, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('root_company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.root_company_id) throw new Error('Empresa não encontrada');

      const dataToSave = {
        name: formData.name,
        description: formData.description,
        program_type: formData.program_type,
        subtype: formData.subtype || null,
        target_percentage: formData.target_percentage ? parseFloat(formData.target_percentage) : null,
        payment_frequency: formData.payment_frequency,
        vesting_months: formData.vesting_months ? parseInt(formData.vesting_months) : null,
        cliff_months: formData.cliff_months ? parseInt(formData.cliff_months) : null,
        matching_percentage: formData.matching_percentage ? parseFloat(formData.matching_percentage) : null,
        is_active: formData.is_active,
        root_company_id: profile.root_company_id,
      };

      if (program) {
        const { error } = await supabase
          .from('incentive_programs')
          .update(dataToSave)
          .eq('id', program.id);

        if (error) throw error;
        toast({ title: 'Programa atualizado com sucesso!' });
      } else {
        const { error } = await supabase
          .from('incentive_programs')
          .insert([dataToSave]);

        if (error) throw error;
        toast({ title: 'Programa criado com sucesso!' });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar programa:', error);
      toast({
        title: 'Erro ao salvar programa',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isLongTerm = formData.program_type === 'long_term';
  const subtypeOptions = programSubtypes[formData.program_type as keyof typeof programSubtypes];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {program ? 'Editar Programa de Incentivo' : 'Novo Programa de Incentivo'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Programa *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: PLR 2025"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="program_type">Tipo *</Label>
              <Select
                value={formData.program_type}
                onValueChange={(value) => setFormData({ ...formData, program_type: value, subtype: '' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short_term">ICP - Incentivo de Curto Prazo</SelectItem>
                  <SelectItem value="long_term">ILP - Incentivo de Longo Prazo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtype">Subtipo</Label>
            <Select
              value={formData.subtype}
              onValueChange={(value) => setFormData({ ...formData, subtype: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o subtipo" />
              </SelectTrigger>
              <SelectContent>
                {subtypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do programa"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_percentage">Percentual-Alvo (%)</Label>
              <Input
                id="target_percentage"
                type="number"
                step="0.01"
                value={formData.target_percentage}
                onChange={(e) => setFormData({ ...formData, target_percentage: e.target.value })}
                placeholder="Ex: 10"
              />
              <p className="text-xs text-muted-foreground">Percentual sobre o salário fixo</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_frequency">Periodicidade</Label>
              <Select
                value={formData.payment_frequency}
                onValueChange={(value) => setFormData({ ...formData, payment_frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="semiannual">Semestral</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLongTerm && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium">Configurações de ILP</h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vesting_months">Vesting (meses)</Label>
                  <Input
                    id="vesting_months"
                    type="number"
                    value={formData.vesting_months}
                    onChange={(e) => setFormData({ ...formData, vesting_months: e.target.value })}
                    placeholder="Ex: 48"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cliff_months">Cliff (meses)</Label>
                  <Input
                    id="cliff_months"
                    type="number"
                    value={formData.cliff_months}
                    onChange={(e) => setFormData({ ...formData, cliff_months: e.target.value })}
                    placeholder="Ex: 12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="matching_percentage">Matching (%)</Label>
                  <Input
                    id="matching_percentage"
                    type="number"
                    step="0.01"
                    value={formData.matching_percentage}
                    onChange={(e) => setFormData({ ...formData, matching_percentage: e.target.value })}
                    placeholder="Ex: 100"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Programa ativo</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : program ? 'Atualizar' : 'Criar Programa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
