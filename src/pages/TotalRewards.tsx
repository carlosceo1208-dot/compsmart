import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { FileText, Download, DollarSign, Gift, TrendingUp, Users, PieChart } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"];

const TotalRewards = () => {
  const { activeCompanyId } = useCompanyContext();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  // Fetch employees
  const { data: employees } = useQuery({
    queryKey: ["total-rewards-employees", activeCompanyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, job_title, grade, salary, status")
        .eq("status", "active")
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch selected employee benefits
  const { data: employeeBenefits } = useQuery({
    queryKey: ["total-rewards-benefits", selectedEmployee],
    enabled: !!selectedEmployee,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_benefits")
        .select(`
          id,
          company_contribution_value,
          employee_contribution_value,
          employee_contribution_type,
          benefit_id,
          benefits (name, benefit_type)
        `)
        .eq("employee_id", selectedEmployee)
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch employee incentives
  const { data: employeeIncentives } = useQuery({
    queryKey: ["total-rewards-incentives", selectedEmployee],
    enabled: !!selectedEmployee,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_incentive_assignments")
        .select(`
          id,
          target_value,
          actual_value,
          program_id,
          incentive_programs (name, program_type, incentive_type)
        `)
        .eq("employee_id", selectedEmployee)
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
  });

  const employee = employees?.find((e) => e.id === selectedEmployee);
  const baseSalary = employee?.salary || 0;
  const annualSalary = baseSalary * 13; // 13th salary

  // Calculate total benefits (monthly)
  const totalBenefitsMonthly = employeeBenefits?.reduce((sum, eb) => {
    return sum + (eb.company_contribution_value || 0);
  }, 0) || 0;
  const totalBenefitsAnnual = totalBenefitsMonthly * 12;

  // Calculate total incentives (annual target)
  const totalIncentivesAnnual = employeeIncentives?.reduce((sum, ei) => {
    return sum + (ei.target_value || 0);
  }, 0) || 0;

  const totalCompensation = annualSalary + totalBenefitsAnnual + totalIncentivesAnnual;

  // Pie chart data
  const pieData = [
    { name: "Salário Base (13°)", value: annualSalary },
    ...(totalBenefitsAnnual > 0 ? [{ name: "Benefícios", value: totalBenefitsAnnual }] : []),
    ...(totalIncentivesAnnual > 0 ? [{ name: "Incentivos", value: totalIncentivesAnnual }] : []),
  ].filter((d) => d.value > 0);

  // Benefits breakdown for bar chart
  const benefitsBreakdown = employeeBenefits?.map((eb) => ({
    name: (eb.benefits as any)?.name || "Benefício",
    valor: eb.company_contribution_value || 0,
  })) || [];

  // Incentives breakdown
  const icpIncentives = employeeIncentives?.filter((ei) => (ei.incentive_programs as any)?.incentive_type === "ICP") || [];
  const ilpIncentives = employeeIncentives?.filter((ei) => (ei.incentive_programs as any)?.incentive_type === "ILP") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Total Rewards Statement
          </h1>
          <p className="text-muted-foreground mt-1">
            Demonstrativo de Remuneração Total do colaborador
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Selecione um colaborador" />
            </SelectTrigger>
            <SelectContent>
              {employees?.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedEmployee ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Selecione um colaborador</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Escolha um colaborador para visualizar o demonstrativo completo de remuneração total 
              incluindo salário, benefícios e incentivos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Employee Header Card */}
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{employee?.full_name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">{employee?.job_title || "Sem cargo"}</span>
                    {employee?.grade && (
                      <Badge variant="outline" className="text-xs">{employee.grade}</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Remuneração Total Anual</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(totalCompensation)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(totalCompensation / 12)}/mês (média)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Salário Base Anual</p>
                    <p className="text-lg font-bold">{formatCurrency(annualSalary)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(baseSalary)}/mês × 13
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <Gift className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Benefícios Anual</p>
                    <p className="text-lg font-bold">{formatCurrency(totalBenefitsAnnual)}</p>
                    <p className="text-xs text-muted-foreground">
                      {employeeBenefits?.length || 0} benefício(s) ativo(s)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Incentivos (Target)</p>
                    <p className="text-lg font-bold">{formatCurrency(totalIncentivesAnnual)}</p>
                    <p className="text-xs text-muted-foreground">
                      {icpIncentives.length} ICP + {ilpIncentives.length} ILP
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart - Compensation Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Composição da Remuneração Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPie>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Sem dados</p>
                )}
              </CardContent>
            </Card>

            {/* Benefits Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Detalhamento de Benefícios (mensal)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {benefitsBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={benefitsBreakdown} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(v) => `R$ ${v}`} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="valor" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhum benefício atribuído</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Incentives Detail */}
          {(icpIncentives.length > 0 || ilpIncentives.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ICP */}
              {icpIncentives.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Incentivos de Curto Prazo (ICP)</CardTitle>
                    <CardDescription>PLR, Bônus, Comissões</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {icpIncentives.map((inc) => (
                        <div key={inc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium text-sm">{(inc.incentive_programs as any)?.name}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {(inc.incentive_programs as any)?.program_type}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">{formatCurrency(inc.target_value)}</p>
                            <p className="text-xs text-muted-foreground">target</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ILP */}
              {ilpIncentives.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Incentivos de Longo Prazo (ILP)</CardTitle>
                    <CardDescription>Stock Options, RSU, Phantom Shares</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {ilpIncentives.map((inc) => (
                        <div key={inc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium text-sm">{(inc.incentive_programs as any)?.name}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {(inc.incentive_programs as any)?.program_type}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">{formatCurrency(inc.target_value)}</p>
                            <p className="text-xs text-muted-foreground">target</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Pay Mix Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pay Mix (Composição)</CardTitle>
              <CardDescription>Proporção entre componentes fixos e variáveis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 h-8 rounded-full overflow-hidden">
                {totalCompensation > 0 && (
                  <>
                    <div
                      className="h-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground"
                      style={{ width: `${(annualSalary / totalCompensation) * 100}%` }}
                    >
                      {((annualSalary / totalCompensation) * 100).toFixed(0)}% Fixo
                    </div>
                    {totalBenefitsAnnual > 0 && (
                      <div
                        className="h-full bg-secondary flex items-center justify-center text-[10px] font-bold text-secondary-foreground"
                        style={{ width: `${(totalBenefitsAnnual / totalCompensation) * 100}%` }}
                      >
                        {((totalBenefitsAnnual / totalCompensation) * 100).toFixed(0)}% Ben.
                      </div>
                    )}
                    {totalIncentivesAnnual > 0 && (
                      <div
                        className="h-full bg-amber-500 flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ width: `${(totalIncentivesAnnual / totalCompensation) * 100}%` }}
                      >
                        {((totalIncentivesAnnual / totalCompensation) * 100).toFixed(0)}% Var.
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary inline-block" /> Salário Fixo</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-secondary inline-block" /> Benefícios</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Variável</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default TotalRewards;
