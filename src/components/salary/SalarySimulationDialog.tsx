import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, DollarSign, Users, TrendingUp, Save } from "lucide-react";
import { 
  ScaledRule, 
  calculateSimulationPreview, 
  SimulationPreview,
  useCollectiveAdjustments 
} from "@/hooks/useCollectiveAdjustments";
import { ScaledRulesEditor } from "./ScaledRulesEditor";
import { formatCurrency } from "@/lib/formatters";
import { useCompanyContext } from "@/contexts/CompanyContext";

interface SalarySimulationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MONTH_OPTIONS = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

export function SalarySimulationDialog({ open, onOpenChange }: SalarySimulationDialogProps) {
  const currentYear = new Date().getFullYear();
  const { createAdjustment } = useCollectiveAdjustments();
  const { activeCompanyId } = useCompanyContext();

  // Form state
  const [adjustmentName, setAdjustmentName] = useState('');
  const [fiscalYear, setFiscalYear] = useState(currentYear + 1);
  const [effectiveMonth, setEffectiveMonth] = useState('5');
  const [adjustmentType, setAdjustmentType] = useState<'fixed_percentage' | 'scaled'>('fixed_percentage');
  const [fixedPercentage, setFixedPercentage] = useState(5);
  const [scaledRules, setScaledRules] = useState<ScaledRule[]>([
    { max_salary: 3000, percentage: 7, fixed_amount: 0 },
    { max_salary: 5000, percentage: 5, fixed_amount: 210 },
    { max_salary: 10000, percentage: 4, fixed_amount: 360 },
    { max_salary: null, percentage: 3, fixed_amount: 560 },
  ]);

  // Filters
  const [filterUnitId, setFilterUnitId] = useState<string>('all');
  const [filterGrades, setFilterGrades] = useState<string[]>([]);
  const [filterSalaryMin, setFilterSalaryMin] = useState<number | undefined>();
  const [filterSalaryMax, setFilterSalaryMax] = useState<number | undefined>();

  // Preview state
  const [preview, setPreview] = useState<SimulationPreview[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch units
  const { data: units } = useQuery({
    queryKey: ['organizational-units', activeCompanyId],
    queryFn: async () => {
      let query = supabase
        .from('organizational_structure')
        .select('id, description, code, type, root_company_id')
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

  // Fetch grades
  const { data: grades } = useQuery({
    queryKey: ['available-grades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salary_ranges')
        .select('grade')
        .order('grade');
      if (error) throw error;
      return [...new Set(data.map(d => d.grade))];
    },
  });

  // Fetch user info
  const { data: userInfo } = useQuery({
    queryKey: ['current-user-company'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('root_company_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return { userId: user.id, rootCompanyId: profile.root_company_id };
    },
  });

  const calculatePreview = async () => {
    setIsCalculating(true);
    try {
      const result = await calculateSimulationPreview({
        adjustment_type: adjustmentType,
        fixed_percentage: adjustmentType === 'fixed_percentage' ? fixedPercentage : undefined,
        scaled_rules: adjustmentType === 'scaled' ? scaledRules : undefined,
        filter_unit_id: filterUnitId !== 'all' ? filterUnitId : undefined,
        filter_grades: filterGrades.length > 0 ? filterGrades : undefined,
        filter_salary_min: filterSalaryMin,
        filter_salary_max: filterSalaryMax,
      });
      setPreview(result);
    } catch (error) {
      console.error('Error calculating preview:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!adjustmentName.trim() || !userInfo) return;

    setIsSaving(true);
    try {
      const totalMonthlyCost = preview.reduce((sum, p) => sum + p.increase, 0);
      const monthsRemaining = 12 - parseInt(effectiveMonth) + 1;
      const totalAnnualCost = totalMonthlyCost * monthsRemaining;

      await createAdjustment.mutateAsync({
        fiscal_year: fiscalYear,
        effective_month: parseInt(effectiveMonth),
        adjustment_name: adjustmentName,
        adjustment_type: adjustmentType,
        fixed_percentage: adjustmentType === 'fixed_percentage' ? fixedPercentage : undefined,
        scaled_rules: adjustmentType === 'scaled' ? scaledRules : undefined,
        filter_unit_id: filterUnitId !== 'all' ? filterUnitId : undefined,
        filter_grades: filterGrades.length > 0 ? filterGrades : undefined,
        filter_salary_min: filterSalaryMin,
        filter_salary_max: filterSalaryMax,
        total_employees_affected: preview.length,
        total_monthly_cost: totalMonthlyCost,
        total_annual_cost: totalAnnualCost,
        status: 'simulation',
        created_by: userInfo.userId,
        root_company_id: userInfo.rootCompanyId!,
      });

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving simulation:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setAdjustmentName('');
    setFixedPercentage(5);
    setPreview([]);
    setFilterUnitId('all');
    setFilterGrades([]);
    setFilterSalaryMin(undefined);
    setFilterSalaryMax(undefined);
  };

  // Calculate totals
  const totalMonthlyCost = preview.reduce((sum, p) => sum + p.increase, 0);
  const monthsRemaining = 12 - parseInt(effectiveMonth) + 1;
  const totalAnnualCost = totalMonthlyCost * monthsRemaining;
  const avgIncreasePercent = preview.length > 0
    ? preview.reduce((sum, p) => sum + p.increasePercent, 0) / preview.length
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Nova Simulação de Ajuste Coletivo
          </DialogTitle>
          <DialogDescription>
            Simule o impacto de um ajuste salarial coletivo (ACT, Dissídio, etc.)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 pr-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Configuration */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nome do Ajuste</Label>
                <Input
                  value={adjustmentName}
                  onChange={(e) => setAdjustmentName(e.target.value)}
                  placeholder="Ex: Dissídio 2026"
                />
              </div>
              <div className="space-y-2">
                <Label>Ano Fiscal</Label>
                <Select value={fiscalYear.toString()} onValueChange={(v) => setFiscalYear(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={(currentYear).toString()}>{currentYear}</SelectItem>
                    <SelectItem value={(currentYear + 1).toString()}>{currentYear + 1}</SelectItem>
                    <SelectItem value={(currentYear + 2).toString()}>{currentYear + 2}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mês de Vigência</Label>
              <Select value={effectiveMonth} onValueChange={setEffectiveMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs value={adjustmentType} onValueChange={(v) => setAdjustmentType(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fixed_percentage">Percentual Fixo</TabsTrigger>
                <TabsTrigger value="scaled">Escalonado</TabsTrigger>
              </TabsList>

              <TabsContent value="fixed_percentage" className="mt-4">
                <div className="space-y-2">
                  <Label>Percentual de Aumento</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      value={fixedPercentage}
                      onChange={(e) => setFixedPercentage(Number(e.target.value))}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="scaled" className="mt-4">
                <ScaledRulesEditor rules={scaledRules} onChange={setScaledRules} />
              </TabsContent>
            </Tabs>

            {/* Filters */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Filtros (Opcional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Unidade</Label>
                  <Select value={filterUnitId} onValueChange={setFilterUnitId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toda Empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toda Empresa</SelectItem>
                      {units?.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.description || u.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Salário Mínimo</Label>
                    <Input
                      type="number"
                      value={filterSalaryMin || ''}
                      onChange={(e) => setFilterSalaryMin(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="R$ 0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Salário Máximo</Label>
                    <Input
                      type="number"
                      value={filterSalaryMax || ''}
                      onChange={(e) => setFilterSalaryMax(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Sem limite"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={calculatePreview} 
              disabled={isCalculating}
              className="w-full"
            >
              <Calculator className="w-4 h-4 mr-2" />
              {isCalculating ? 'Calculando...' : 'Calcular Preview'}
            </Button>
          </div>

          {/* Right: Preview */}
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-primary/5">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Funcionários</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{preview.length}</p>
                </CardContent>
              </Card>

              <Card className="bg-amber-50 dark:bg-amber-950">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    <span className="text-xs text-muted-foreground">Média %</span>
                  </div>
                  <p className="text-2xl font-bold mt-1 text-amber-600">
                    {avgIncreasePercent.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-50 dark:bg-green-950">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-muted-foreground">Custo Mensal</span>
                  </div>
                  <p className="text-lg font-bold mt-1 text-green-600">
                    +{formatCurrency(totalMonthlyCost)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 dark:bg-blue-950">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-muted-foreground">Custo Anual ({monthsRemaining}m)</span>
                  </div>
                  <p className="text-lg font-bold mt-1 text-blue-600">
                    +{formatCurrency(totalAnnualCost)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Employee List */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Detalhamento por Funcionário</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[200px] overflow-y-auto">
                  {preview.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Clique em "Calcular Preview" para ver o impacto
                    </div>
                  ) : (
                    <div className="divide-y">
                      {preview.map((p) => (
                        <div key={p.employeeId} className="p-3 hover:bg-muted/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{p.employeeName}</p>
                              <p className="text-xs text-muted-foreground">Grade {p.grade}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground line-through">
                                  {formatCurrency(p.currentSalary)}
                                </span>
                                <span className="text-sm font-medium">
                                  {formatCurrency(p.newSalary)}
                                </span>
                              </div>
                              <Badge variant="outline" className="text-green-600 text-xs">
                                +{formatCurrency(p.increase)} ({p.increasePercent.toFixed(1)}%)
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSave}
              disabled={isSaving || preview.length === 0 || !adjustmentName.trim()}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar Simulação'}
            </Button>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
