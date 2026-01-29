import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';
import { MODALITY_OPTIONS, type SalaryModality, getModalityConfig } from '@/lib/salaryModality';

interface SalaryTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId?: string | null;
  onSuccess: () => void;
}

interface SalaryTable {
  id: string;
  name: string;
  effective_month: number;
  effective_year: number;
  is_active: boolean;
  modality?: SalaryModality;
}

const MONTHS = [
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

export function SalaryTableDialog({ open, onOpenChange, tableId, onSuccess }: SalaryTableDialogProps) {
  const { toast } = useToast();
  const { hasAccess, plan, isAdminOrSuperAdmin } = useFeatureAccess();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [effectiveMonth, setEffectiveMonth] = useState<number>(new Date().getMonth() + 1);
  const [effectiveYear, setEffectiveYear] = useState<number>(new Date().getFullYear());
  const [isActive, setIsActive] = useState(false);
  const [modality, setModality] = useState<SalaryModality>('fixed_salary');

  // Check if user has access to advanced modalities (Pro/Enterprise OR admin/super_admin)
  const hasAdvancedModalities = hasAccess('salary_modality_advanced');

  useEffect(() => {
    if (open && tableId) {
      fetchTable();
    } else if (open) {
      resetForm();
    }
  }, [open, tableId]);

  const fetchTable = async () => {
    if (!tableId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('salary_tables')
        .select('*')
        .eq('id', tableId)
        .single();

      if (error) throw error;

      if (data) {
        setName(data.name);
        setEffectiveMonth(data.effective_month);
        setEffectiveYear(data.effective_year);
        setIsActive(data.is_active);
        setModality((data.modality as SalaryModality) || 'fixed_salary');
      }
    } catch (error) {
      console.error('Error fetching salary table:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a tabela salarial',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEffectiveMonth(new Date().getMonth() + 1);
    setEffectiveYear(new Date().getFullYear());
    setIsActive(false);
    setModality('fixed_salary');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome da tabela é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    // Check modality access
    if (modality !== 'fixed_salary' && !hasAdvancedModalities) {
      toast({
        title: 'Plano Insuficiente',
        description: 'Total Cash e Total Compensation requerem plano Pro ou Enterprise',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Get user's root_company_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('root_company_id')
        .eq('id', user.id)
        .single();

      if (!userProfile?.root_company_id) throw new Error('Company not found');

      const tableData = {
        name: name.trim(),
        effective_month: effectiveMonth,
        effective_year: effectiveYear,
        is_active: isActive,
        root_company_id: userProfile.root_company_id,
        modality: modality,
      };

      if (tableId) {
        const { error } = await supabase
          .from('salary_tables')
          .update(tableData)
          .eq('id', tableId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('salary_tables')
          .insert(tableData);

        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: tableId ? 'Tabela atualizada com sucesso' : 'Tabela criada com sucesso',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving salary table:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar a tabela salarial',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isModalityLocked = (mod: SalaryModality) => {
    return mod !== 'fixed_salary' && !hasAdvancedModalities;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {tableId ? 'Editar Tabela Salarial' : 'Nova Tabela Salarial'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Tabela *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pequenas & Médias Empresas"
              required
            />
          </div>

          {/* Modality Selection */}
          <div className="space-y-2">
            <Label>Modalidade de Remuneração *</Label>
            <div className="grid grid-cols-1 gap-2">
              {MODALITY_OPTIONS.map((opt) => {
                const config = getModalityConfig(opt.value);
                const locked = isModalityLocked(opt.value);
                const isSelected = modality === opt.value;
                
                return (
                  <div
                    key={opt.value}
                    onClick={() => !locked && setModality(opt.value)}
                    className={`
                      relative flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${isSelected ? `${config.borderColor} ${config.bgColor}` : 'border-muted hover:border-muted-foreground/50'}
                      ${locked ? 'opacity-60 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className={`w-3 h-3 rounded-full ${isSelected ? config.bgColor.replace('100', '500').replace('900', '400') : 'bg-muted'}`} 
                      style={{ backgroundColor: isSelected ? (opt.value === 'fixed_salary' ? '#2563eb' : opt.value === 'total_cash' ? '#059669' : '#9333ea') : undefined }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isSelected ? config.color : ''}`}>
                          {opt.label}
                        </span>
                        {locked && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Lock className="w-3 h-3" />
                            Pro+
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Mês de Vigência *</Label>
              <Select
                value={effectiveMonth.toString()}
                onValueChange={(value) => setEffectiveMonth(parseInt(value))}
              >
                <SelectTrigger id="month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Ano de Vigência *</Label>
              <Input
                id="year"
                type="number"
                min="2020"
                max="2100"
                value={effectiveYear}
                onChange={(e) => setEffectiveYear(parseInt(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="active">Tabela Ativa</Label>
              <p className="text-sm text-muted-foreground">
                Apenas uma tabela pode estar ativa por modalidade
              </p>
            </div>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
