/**
 * ✅ MIGRADO: Formatação centralizada implementada
 * Data: 2025-01-20
 * 
 * Sistema de Elegibilidade de Benefícios por Grade e Faixa Salarial implementado
 * - Badges de elegibilidade
 * - Regras configuráveis por benefício
 * - Atribuição automática baseada em regras
 * - Vale Transporte com cálculo de 6%
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BenefitDialog } from '@/components/benefits/BenefitDialog';
import { EmployeeBenefitDialog } from '@/components/benefits/EmployeeBenefitDialog';
import { BenefitsHistoryChart } from '@/components/benefits/BenefitsHistoryChart';
import { BenefitsComparisonDashboard } from '@/components/benefits/BenefitsComparisonDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, Users, DollarSign, Pencil, TrendingUp } from 'lucide-react';
import { useBenefitsKPI } from '@/hooks/useBenefitsKPI';
import { formatCurrency, formatCurrencyNoDecimals, formatDecimal, toFixedSafe } from '@/lib/formatters';

const Benefits = () => {
  const { data: kpiData, isLoading: loadingKPI } = useBenefitsKPI();
  
  const { data: benefits, isLoading: loadingBenefits } = useQuery({
    queryKey: ['benefits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('benefits')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-for-benefits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, employee_number, job_title, grade')
        .eq('status', 'active')
        .order('full_name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: employeeBenefits, isLoading: loadingEmployeeBenefits } = useQuery({
    queryKey: ['all-employee-benefits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_benefits')
        .select(`
          *,
          employee:profiles!employee_benefits_employee_id_fkey(full_name, employee_number),
          benefit:benefits!employee_benefits_benefit_id_fkey(name, benefit_type)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const getBenefitTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      health: 'Saúde',
      dental: 'Odontológico',
      life_insurance: 'Seguro de Vida',
      meal_voucher: 'Vale Refeição',
      food_voucher: 'Vale Alimentação',
      transportation: 'Vale Transporte',
      education: 'Educação',
      gym: 'Academia',
      other: 'Outro',
    };
    return types[type] || type;
  };

  const getEligibilityBadge = (eligibilityType: string) => {
    switch (eligibilityType) {
      case 'grade':
        return (
          <Badge variant="default" className="gap-1">
            📊 Por Grade
          </Badge>
        );
      case 'salary_range':
        return (
          <Badge variant="default" className="gap-1">
            💰 Por Salário
          </Badge>
        );
      case 'none':
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            ✨ Todos Elegíveis
          </Badge>
        );
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Benefícios</h1>
          <p className="text-muted-foreground">
            Configure benefícios e atribua aos funcionários
          </p>
        </div>
        <BenefitDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Benefícios</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingKPI ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{kpiData?.totalBenefits || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              benefícios cadastrados ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários com Benefícios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingKPI ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{kpiData?.employeesWithBenefits || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              de {employees?.length || 0} funcionários ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingKPI ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(kpiData?.totalCost || 0)}
              </div>
            )}
            
            {/* Breakdown visual */}
            {!loadingKPI && kpiData && kpiData.totalCost > 0 && (
              <div className="mt-3 space-y-2">
                {/* Barra de progresso visual */}
                <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                  <div 
                    className="bg-primary transition-all duration-300" 
                    style={{ 
                      width: `${100 - (kpiData.employeeCostPercentage || 0)}%` 
                    }}
                  />
                  <div 
                    className="bg-orange-500 transition-all duration-300" 
                    style={{ 
                      width: `${kpiData.employeeCostPercentage || 0}%` 
                    }}
                  />
                </div>
                
                {/* Legenda */}
                <div className="flex justify-between text-xs gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-muted-foreground truncate">
                      Empresa: {formatCurrencyNoDecimals(kpiData.companyCost || 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                    <span className="text-muted-foreground truncate">
                      Funcionário: {formatCurrencyNoDecimals(kpiData.employeeCost || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participação Funcionário</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingKPI ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {formatDecimal(kpiData?.employeeCostPercentage || 0, 1)}%
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {kpiData?.employeeCostPercentage && kpiData.employeeCostPercentage > 0
                ? `Economia de ${formatCurrencyNoDecimals(kpiData.employeeCost || 0)} para empresa`
                : 'Empresa arca com 100% dos custos'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="catalog" className="space-y-4">
        <TabsList>
          <TabsTrigger value="catalog">Catálogo de Benefícios</TabsTrigger>
          <TabsTrigger value="assignments">Benefícios Atribuídos</TabsTrigger>
          <TabsTrigger value="employees">Atribuir por Funcionário</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="comparison">Comparação por Unidade</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          {loadingBenefits ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {benefits?.map((benefit) => (
                <Card key={benefit.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="flex items-center gap-2 flex-wrap">
                          {benefit.name}
                          {benefit.is_active ? (
                            <Badge variant="default" className="text-xs">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Inativo</Badge>
                          )}
                          {benefit.is_template && (
                            <Badge variant="outline" className="text-xs">Template</Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardDescription>{getBenefitTypeLabel(benefit.benefit_type)}</CardDescription>
                          {getEligibilityBadge(benefit.eligibility_type || 'none')}
                        </div>
                      </div>
                      <BenefitDialog
                        benefit={benefit}
                        trigger={
                          <Button size="sm" variant="ghost">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Valor Total:</span>
                        <span className="font-semibold">{formatCurrency(benefit.value_per_employee)}</span>
                      </div>
                      {benefit.default_employee_contribution_type && benefit.default_employee_contribution_type !== 'none' && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Participação Funcionário:</span>
                          <span className="font-semibold">
                            {benefit.default_employee_contribution_type === 'percentage'
                              ? `${benefit.default_employee_contribution_value}% (${formatCurrency((benefit.value_per_employee * (benefit.default_employee_contribution_value || 0)) / 100)})`
                              : formatCurrency(benefit.default_employee_contribution_value || 0)
                            }
                          </span>
                        </div>
                      )}
                      {benefit.description && (
                        <p className="text-sm text-muted-foreground pt-2">{benefit.description}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          {loadingEmployeeBenefits ? (
            <Skeleton className="h-96" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Benefícios Atribuídos</CardTitle>
                <CardDescription>Lista de todos os benefícios ativos atribuídos aos funcionários</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employeeBenefits?.map((eb) => (
                    <div key={eb.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {eb.employee?.full_name} ({eb.employee?.employee_number})
                        </p>
                        <p className="text-sm text-muted-foreground">{eb.benefit?.name}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm font-semibold">
                          Empresa: {formatCurrency(eb.company_contribution_value)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Funcionário: {eb.employee_contribution_type === 'percentage' 
                            ? `${eb.employee_contribution_value}% (${formatCurrency((eb.company_contribution_value * eb.employee_contribution_value) / 100)})`
                            : formatCurrency(eb.employee_contribution_value)
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atribuir Benefícios por Funcionário</CardTitle>
              <CardDescription>Selecione um funcionário para atribuir benefícios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {employees?.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{employee.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {employee.employee_number} • {employee.job_title || 'Sem cargo'} • Grade {employee.grade || 'N/A'}
                      </p>
                    </div>
                    <EmployeeBenefitDialog employeeId={employee.id} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <BenefitsHistoryChart />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <BenefitsComparisonDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Benefits;
