import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BenefitDialog } from '@/components/benefits/BenefitDialog';
import { EmployeeBenefitDialog } from '@/components/benefits/EmployeeBenefitDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, Users, DollarSign, Pencil } from 'lucide-react';

const Benefits = () => {
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Benefícios</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{benefits?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {benefits?.filter(b => b.is_active).length || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários com Benefícios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(employeeBenefits?.map(eb => eb.employee_id)).size || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              de {employees?.length || 0} funcionários ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Mensal Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(employeeBenefits?.reduce((sum, eb) => sum + (eb.company_contribution_value || 0), 0) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Contribuição da empresa
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="catalog" className="space-y-4">
        <TabsList>
          <TabsTrigger value="catalog">Catálogo de Benefícios</TabsTrigger>
          <TabsTrigger value="assignments">Benefícios Atribuídos</TabsTrigger>
          <TabsTrigger value="employees">Atribuir por Funcionário</TabsTrigger>
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
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {benefit.name}
                          {benefit.is_active ? (
                            <Badge variant="default" className="text-xs">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Inativo</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{getBenefitTypeLabel(benefit.benefit_type)}</CardDescription>
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
                        <span className="font-semibold">R$ {benefit.value_per_employee.toFixed(2)}</span>
                      </div>
                      {benefit.default_employee_contribution_type && benefit.default_employee_contribution_type !== 'none' && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Participação Funcionário:</span>
                          <span className="font-semibold">
                            {benefit.default_employee_contribution_type === 'percentage'
                              ? `${benefit.default_employee_contribution_value}% (R$ ${((benefit.value_per_employee * (benefit.default_employee_contribution_value || 0)) / 100).toFixed(2)})`
                              : `R$ ${(benefit.default_employee_contribution_value || 0).toFixed(2)}`
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
                          Empresa: R$ {eb.company_contribution_value.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Funcionário: {eb.employee_contribution_type === 'percentage' 
                            ? `${eb.employee_contribution_value}% (R$ ${((eb.company_contribution_value * eb.employee_contribution_value) / 100).toFixed(2)})`
                            : `R$ ${eb.employee_contribution_value.toFixed(2)}`
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
      </Tabs>
    </div>
  );
};

export default Benefits;
