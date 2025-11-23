/**
 * ✅ MIGRADO: Formatação centralizada implementada
 * Data: 2025-01-20
 * 
 * Todas as formatações monetárias agora usam @/lib/formatters
 * para prevenir RangeError e garantir consistência.
 */
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Plus, Pencil, Info } from 'lucide-react';
import { z } from 'zod';
import { toFixedSafe } from '@/lib/formatters';
import { BenefitEligibilityManager, EligibilityRule } from './BenefitEligibilityManager';

const benefitSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').nullable(),
  benefit_type: z.enum(['health', 'dental', 'life_insurance', 'meal_voucher', 'food_voucher', 'transportation', 'education', 'gym', 'other']),
  value_per_employee: z.number().min(0, 'Valor deve ser maior ou igual a zero'),
  default_employee_contribution_type: z.enum(['none', 'fixed', 'percentage']),
  default_employee_contribution_value: z.number().min(0, 'Valor deve ser maior ou igual a zero').max(100, 'Percentual não pode ser maior que 100'),
  is_active: z.boolean(),
  eligibility_type: z.enum(['none', 'grade', 'salary_range']),
});

interface Benefit {
  id: string;
  name: string;
  description: string | null;
  benefit_type: string;
  value_per_employee: number;
  default_employee_contribution_type?: string;
  default_employee_contribution_value?: number;
  is_active: boolean;
  eligibility_type?: string;
  is_template?: boolean;
  template_type?: string;
}

interface BenefitDialogProps {
  benefit?: Benefit;
  trigger?: React.ReactNode;
}

export const BenefitDialog = ({ benefit, trigger }: BenefitDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [eligibilityRules, setEligibilityRules] = useState<EligibilityRule[]>([]);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: benefit?.name || '',
    description: benefit?.description || '',
    benefit_type: benefit?.benefit_type || 'health',
    value_per_employee: benefit?.value_per_employee || 0,
    default_employee_contribution_type: (benefit?.default_employee_contribution_type as 'none' | 'fixed' | 'percentage') || 'none',
    default_employee_contribution_value: benefit?.default_employee_contribution_value || 0,
    is_active: benefit?.is_active ?? true,
    eligibility_type: (benefit?.eligibility_type as 'none' | 'grade' | 'salary_range') || 'none',
  });

  // Carregar regras existentes ao editar
  useEffect(() => {
    const loadRules = async () => {
      if (benefit?.id) {
        const { data, error } = await supabase
          .from('benefit_eligibility_rules')
          .select('*')
          .eq('benefit_id', benefit.id)
          .eq('is_active', true);
        
        if (!error && data) {
          setEligibilityRules(data.map(rule => ({
            ...rule,
            employee_contribution_type: rule.employee_contribution_type as 'none' | 'fixed' | 'percentage',
          })));
        }
      }
    };
    loadRules();
  }, [benefit?.id]);

  const calculatedEmployeeValue = formData.default_employee_contribution_type === 'percentage'
    ? (formData.value_per_employee * formData.default_employee_contribution_value) / 100
    : formData.default_employee_contribution_value;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setValidationErrors({});

    try {
      // Validate with zod
      const validatedData = benefitSchema.parse(formData);

      // Additional validation for percentage
      if (validatedData.default_employee_contribution_type === 'percentage' && 
          validatedData.default_employee_contribution_value > 100) {
        setValidationErrors({ default_employee_contribution_value: 'Percentual não pode ser maior que 100%' });
        setLoading(false);
        return;
      }

      // Get user's root_company_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('root_company_id')
        .eq('id', user.id)
        .single();

      if (!userProfile?.root_company_id) throw new Error('Company not found');

      // Salvar benefício e obter ID
      let benefitId = benefit?.id;
      
      if (benefit) {
        const { error } = await supabase
          .from('benefits')
          .update({
            name: validatedData.name,
            description: validatedData.description,
            benefit_type: validatedData.benefit_type,
            value_per_employee: validatedData.value_per_employee,
            default_employee_contribution_type: validatedData.default_employee_contribution_type,
            default_employee_contribution_value: validatedData.default_employee_contribution_value,
            is_active: validatedData.is_active,
            eligibility_type: validatedData.eligibility_type,
            root_company_id: userProfile.root_company_id,
          })
          .eq('id', benefit.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('benefits')
          .insert([{
            name: validatedData.name,
            description: validatedData.description,
            benefit_type: validatedData.benefit_type,
            value_per_employee: validatedData.value_per_employee,
            default_employee_contribution_type: validatedData.default_employee_contribution_type,
            default_employee_contribution_value: validatedData.default_employee_contribution_value,
            is_active: validatedData.is_active,
            eligibility_type: validatedData.eligibility_type,
            root_company_id: userProfile.root_company_id,
          }])
          .select()
          .single();

        if (error) throw error;
        benefitId = data.id;
      }

      // Salvar regras de elegibilidade se houver
      if (validatedData.eligibility_type !== 'none' && eligibilityRules.length > 0 && benefitId) {
        // Desativar regras antigas
        if (benefit?.id) {
          await supabase
            .from('benefit_eligibility_rules')
            .update({ is_active: false })
            .eq('benefit_id', benefitId);
        }

        // Inserir novas regras
        const rulesToInsert = eligibilityRules.map(rule => ({
          benefit_id: benefitId,
          ...rule,
          is_active: true,
        }));

        const { error: rulesError } = await supabase
          .from('benefit_eligibility_rules')
          .insert(rulesToInsert);

        if (rulesError) throw rulesError;
      }

      toast.success(benefit ? 'Benefício atualizado com sucesso' : 'Benefício cadastrado com sucesso');

      queryClient.invalidateQueries({ queryKey: ['benefits'] });
      setOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        toast.error('Por favor, corrija os erros no formulário');
      } else {
        console.error('Error saving benefit:', error);
        toast.error('Erro ao salvar benefício');
      }
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{benefit ? 'Editar Benefício' : 'Novo Benefício'}</DialogTitle>
        </DialogHeader>
        
        {/* Container com scroll */}
        <div className="overflow-y-auto flex-1 pr-2 -mr-2">
          <form id="benefit-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Benefício *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Plano de Saúde"
                required
                maxLength={100}
              />
              {validationErrors.name && (
                <p className="text-sm text-destructive mt-1">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="benefit_type">Tipo de Benefício *</Label>
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
              <Label htmlFor="value_per_employee">Valor Total do Benefício (R$) *</Label>
              <Input
                id="value_per_employee"
                type="number"
                step="0.01"
                min="0"
                value={formData.value_per_employee}
                onChange={(e) => setFormData({ ...formData, value_per_employee: parseFloat(e.target.value) || 0 })}
                required
              />
              {validationErrors.value_per_employee && (
                <p className="text-sm text-destructive mt-1">{validationErrors.value_per_employee}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Valor total que a empresa paga pelo benefício
              </p>
            </div>

            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <Label className="text-base">Participação Padrão do Funcionário</Label>
              <RadioGroup
                value={formData.default_employee_contribution_type}
                onValueChange={(value: 'none' | 'fixed' | 'percentage') => 
                  setFormData({ ...formData, default_employee_contribution_type: value, default_employee_contribution_value: 0 })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="none" />
                  <Label htmlFor="none" className="font-normal cursor-pointer">
                    Empresa paga 100%
                  </Label>
                </div>
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

              {formData.default_employee_contribution_type !== 'none' && (
                <div>
                  <Label htmlFor="default_employee_contribution_value">
                    {formData.default_employee_contribution_type === 'percentage' ? 'Percentual' : 'Valor'} da Participação
                  </Label>
                  <Input
                    id="default_employee_contribution_value"
                    type="number"
                    step={formData.default_employee_contribution_type === 'percentage' ? '0.01' : '0.01'}
                    min="0"
                    max={formData.default_employee_contribution_type === 'percentage' ? '100' : undefined}
                    value={formData.default_employee_contribution_value}
                    onChange={(e) => setFormData({ ...formData, default_employee_contribution_value: parseFloat(e.target.value) || 0 })}
                  />
                  {validationErrors.default_employee_contribution_value && (
                    <p className="text-sm text-destructive mt-1">{validationErrors.default_employee_contribution_value}</p>
                  )}
                </div>
              )}

              {formData.default_employee_contribution_type !== 'none' && formData.default_employee_contribution_value > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    💡 Cálculo: {formData.default_employee_contribution_type === 'percentage' 
                      ? `${formData.default_employee_contribution_value}% de R$ ${toFixedSafe(formData.value_per_employee, 2)} = R$ ${toFixedSafe(calculatedEmployeeValue, 2)}`
                      : `R$ ${toFixedSafe(calculatedEmployeeValue, 2)}`
                    }
                    <br />
                    <span className="text-xs">Empresa paga: R$ {toFixedSafe(formData.value_per_employee - calculatedEmployeeValue, 2)}</span>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes sobre o benefício..."
                rows={3}
                maxLength={500}
              />
              {validationErrors.description && (
                <p className="text-sm text-destructive mt-1">{validationErrors.description}</p>
              )}
            </div>

            {/* Elegibilidade */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base">Elegibilidade do Benefício</Label>
              <RadioGroup
                value={formData.eligibility_type}
                onValueChange={(value: 'none' | 'grade' | 'salary_range') => {
                  setFormData({ ...formData, eligibility_type: value });
                  if (value === 'none') setEligibilityRules([]);
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="eligibility-none" />
                  <Label htmlFor="eligibility-none" className="font-normal cursor-pointer">
                    Sem restrição (todos elegíveis)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="grade" id="eligibility-grade" />
                  <Label htmlFor="eligibility-grade" className="font-normal cursor-pointer">
                    Por Grade/Nível
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="salary_range" id="eligibility-salary" />
                  <Label htmlFor="eligibility-salary" className="font-normal cursor-pointer">
                    Por Faixa Salarial
                  </Label>
                </div>
              </RadioGroup>

              {formData.eligibility_type !== 'none' && (
                <BenefitEligibilityManager
                  eligibilityType={formData.eligibility_type}
                  rules={eligibilityRules}
                  onChange={setEligibilityRules}
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Benefício Ativo</Label>
            </div>
          </form>
        </div>

        {/* Botões fixos no rodapé */}
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="benefit-form" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
