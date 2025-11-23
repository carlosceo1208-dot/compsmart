import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { FeaturesManager } from './FeaturesManager';

type Plan = {
  id: string;
  name: string;
  description: string | null;
  plan_type: string;
  monthly_price: number;
  annual_price: number;
  setup_fee: number | null;
  max_employees: number | null;
  max_users: number | null;
  features: string[];
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
};

type PlanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan | null;
  onSuccess: () => void;
};

export function PlanDialog({ open, onOpenChange, plan, onSuccess }: PlanDialogProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    plan_type: '',
    monthly_price: '',
    annual_price: '',
    setup_fee: '',
    max_employees: '',
    max_users: '',
    features: [] as string[],
    is_active: true,
    is_public: true,
    sort_order: '0',
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        description: plan.description || '',
        plan_type: plan.plan_type,
        monthly_price: plan.monthly_price.toString(),
        annual_price: plan.annual_price.toString(),
        setup_fee: plan.setup_fee?.toString() || '',
        max_employees: plan.max_employees?.toString() || '',
        max_users: plan.max_users?.toString() || '',
        features: plan.features || [],
        is_active: plan.is_active,
        is_public: plan.is_public,
        sort_order: plan.sort_order.toString(),
      });
    } else {
      setFormData({
        name: '',
        description: '',
        plan_type: '',
        monthly_price: '',
        annual_price: '',
        setup_fee: '',
        max_employees: '',
        max_users: '',
        features: [],
        is_active: true,
        is_public: true,
        sort_order: '0',
      });
    }
  }, [plan, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.name || formData.name.length < 3) {
      toast.error('Nome do plano deve ter pelo menos 3 caracteres');
      return;
    }

    if (!formData.plan_type) {
      toast.error('Tipo de plano é obrigatório');
      return;
    }

    if (!formData.monthly_price || parseFloat(formData.monthly_price) <= 0) {
      toast.error('Preço mensal deve ser maior que zero');
      return;
    }

    if (!formData.annual_price || parseFloat(formData.annual_price) <= 0) {
      toast.error('Preço anual deve ser maior que zero');
      return;
    }

    const monthlyPrice = parseFloat(formData.monthly_price);
    const annualPrice = parseFloat(formData.annual_price);
    
    // Validar desconto anual
    if (annualPrice >= monthlyPrice * 12) {
      toast.error('Preço anual deve ser menor que 12x o preço mensal (deve ter desconto)');
      return;
    }

    if (formData.features.length === 0) {
      toast.error('Adicione pelo menos 1 feature ao plano');
      return;
    }

    setSaving(true);

    try {
      const planData = {
        name: formData.name,
        description: formData.description || null,
        plan_type: formData.plan_type,
        monthly_price: parseFloat(formData.monthly_price),
        annual_price: parseFloat(formData.annual_price),
        setup_fee: formData.setup_fee ? parseFloat(formData.setup_fee) : null,
        max_employees: formData.max_employees ? parseInt(formData.max_employees) : null,
        max_users: formData.max_users ? parseInt(formData.max_users) : null,
        features: formData.features,
        is_active: formData.is_active,
        is_public: formData.is_public,
        sort_order: parseInt(formData.sort_order),
      };

      if (plan) {
        // Update
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', plan.id);

        if (error) throw error;
        toast.success('Plano atualizado com sucesso!');
      } else {
        // Create
        const { error } = await supabase
          .from('subscription_plans')
          .insert([planData]);

        if (error) throw error;
        toast.success('Plano criado com sucesso!');
      }

      onSuccess();
    } catch (error: any) {
      toast.error('Erro ao salvar plano: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
          <DialogDescription>
            {plan
              ? 'Atualize as informações do plano de assinatura'
              : 'Crie um novo plano de assinatura para sua plataforma'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Nome do Plano *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Starter, Medium, Pro"
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição curta do plano"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan_type">Tipo de Plano *</Label>
              <Input
                id="plan_type"
                value={formData.plan_type}
                onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
                placeholder="Ex: starter, medium, pro"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Ordem de Exibição</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly_price">Preço Mensal (R$) *</Label>
              <Input
                id="monthly_price"
                type="number"
                step="0.01"
                value={formData.monthly_price}
                onChange={(e) => setFormData({ ...formData, monthly_price: e.target.value })}
                placeholder="199.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="annual_price">Preço Anual (R$) *</Label>
              <Input
                id="annual_price"
                type="number"
                step="0.01"
                value={formData.annual_price}
                onChange={(e) => setFormData({ ...formData, annual_price: e.target.value })}
                placeholder="1990.00"
                required
              />
              {formData.monthly_price && formData.annual_price && (
                <p className="text-xs text-muted-foreground">
                  Desconto: {(((parseFloat(formData.monthly_price) * 12 - parseFloat(formData.annual_price)) / (parseFloat(formData.monthly_price) * 12)) * 100).toFixed(0)}%
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="setup_fee">Taxa de Setup (R$)</Label>
              <Input
                id="setup_fee"
                type="number"
                step="0.01"
                value={formData.setup_fee}
                onChange={(e) => setFormData({ ...formData, setup_fee: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_employees">Limite de Funcionários</Label>
              <Input
                id="max_employees"
                type="number"
                value={formData.max_employees}
                onChange={(e) => setFormData({ ...formData, max_employees: e.target.value })}
                placeholder="Deixe vazio para ilimitado"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_users">Limite de Usuários</Label>
              <Input
                id="max_users"
                type="number"
                value={formData.max_users}
                onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                placeholder="Deixe vazio para ilimitado"
              />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <Label>Features do Plano *</Label>
            <FeaturesManager
              features={formData.features}
              onChange={(features) => setFormData({ ...formData, features })}
            />
          </div>

          {/* Switches */}
          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Plano Ativo
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
              />
              <Label htmlFor="is_public" className="cursor-pointer">
                Visível Publicamente
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : plan ? 'Atualizar Plano' : 'Criar Plano'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
