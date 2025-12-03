import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Download,
  Users,
  DollarSign,
  Calculator,
  FolderOpen
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { SalarySimulationDialog } from "@/components/salary/SalarySimulationDialog";
import { SimulationScenarioCard } from "@/components/salary/SimulationScenarioCard";
import { useCollectiveAdjustments } from "@/hooks/useCollectiveAdjustments";

interface EmployeeAnalysis {
  id: string;
  employee_number: string;
  full_name: string;
  job_title: string;
  grade: string;
  salary: number;
  salary_range_percentage: number;
  category: 'below' | 'within' | 'above';
  deviation: number;
  min_value?: number;
  median_value?: number;
  max_value?: number;
}

const COLORS = {
  below: '#ef4444',
  within: '#22c55e',
  above: '#f59e0b',
};

export default function SalaryAnalysisReport() {
  const [activeTab, setActiveTab] = useState<'all' | 'below' | 'within' | 'above'>('all');
  const [showSimulationDialog, setShowSimulationDialog] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);
  
  const { 
    adjustments, 
    isLoading: isLoadingAdjustments,
    approveForBudget,
    replaceApprovedScenario,
    revertToSimulation,
    effectuateSalaries,
    deleteAdjustment,
  } = useCollectiveAdjustments();

  const { data: employees, isLoading } = useQuery({
    queryKey: ['salary-analysis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          employee_number,
          full_name,
          job_title,
          grade,
          salary,
          salary_range_percentage,
          job_title_id,
          job_titles (
            salary_range_id,
            salary_ranges (
              min_value,
              median_value,
              max_value
            )
          )
        `)
        .eq('status', 'active')
        .not('salary', 'is', null)
        .order('full_name');

      if (error) throw error;

      const analyzed: EmployeeAnalysis[] = data.map(emp => {
        const percentage = emp.salary_range_percentage || 0;
        let category: 'below' | 'within' | 'above';
        
        if (percentage < 0) {
          category = 'below';
        } else if (percentage <= 100) {
          category = 'within';
        } else {
          category = 'above';
        }

        const salaryRange = emp.job_titles?.salary_ranges;

        return {
          id: emp.id,
          employee_number: emp.employee_number || '-',
          full_name: emp.full_name,
          job_title: emp.job_title || '-',
          grade: emp.grade || '-',
          salary: emp.salary,
          salary_range_percentage: percentage,
          category,
          deviation: percentage < 0 ? Math.abs(percentage) : percentage > 100 ? percentage - 100 : 0,
          min_value: salaryRange?.min_value,
          median_value: salaryRange?.median_value,
          max_value: salaryRange?.max_value,
        };
      });

      return analyzed;
    },
  });

  const stats = {
    total: employees?.length || 0,
    below: employees?.filter(e => e.category === 'below').length || 0,
    within: employees?.filter(e => e.category === 'within').length || 0,
    above: employees?.filter(e => e.category === 'above').length || 0,
  };

  const pieData = [
    { name: 'Abaixo da Faixa', value: stats.below, color: COLORS.below },
    { name: 'Dentro da Faixa', value: stats.within, color: COLORS.within },
    { name: 'Acima da Faixa', value: stats.above, color: COLORS.above },
  ];

  const gradeData = employees?.reduce((acc, emp) => {
    const existing = acc.find(item => item.grade === emp.grade);
    if (existing) {
      existing[emp.category]++;
    } else {
      acc.push({
        grade: emp.grade,
        below: emp.category === 'below' ? 1 : 0,
        within: emp.category === 'within' ? 1 : 0,
        above: emp.category === 'above' ? 1 : 0,
      });
    }
    return acc;
  }, [] as Array<{ grade: string; below: number; within: number; above: number }>);

  const filteredEmployees = activeTab === 'all' 
    ? employees 
    : employees?.filter(e => e.category === activeTab);

  const exportToCSV = () => {
    if (!employees) return;

    const headers = ['Registro', 'Nome', 'Cargo', 'Grade', 'Salário', '% Faixa', 'Status', 'Desvio'];
    const rows = employees.map(emp => [
      emp.employee_number,
      emp.full_name,
      emp.job_title,
      emp.grade,
      emp.salary.toString(),
      emp.salary_range_percentage.toFixed(2),
      emp.category === 'below' ? 'Abaixo' : emp.category === 'within' ? 'Dentro' : 'Acima',
      emp.deviation.toFixed(2) + '%'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analise-salarial-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Análise Salarial</h1>
          <p className="text-muted-foreground mt-1">
            Relatório de posicionamento salarial dos funcionários
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowSimulationDialog(true)}>
            <Calculator className="w-4 h-4 mr-2" />
            Nova Simulação
          </Button>
          <Button onClick={() => setShowScenarios(!showScenarios)} variant="outline">
            <FolderOpen className="w-4 h-4 mr-2" />
            Cenários ({adjustments.length})
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Simulation Scenarios */}
      {showScenarios && adjustments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Simulações de Ajuste Coletivo
            </CardTitle>
            <CardDescription>
              Gerencie cenários de ajuste salarial (ACT, Dissídio, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adjustments.map((adj) => (
                <SimulationScenarioCard
                  key={adj.id}
                  adjustment={adj}
                  onApproveForBudget={async () => { await approveForBudget.mutateAsync(adj.id); }}
                  onEffectuate={() => effectuateSalaries.mutate(adj)}
                  onDelete={() => deleteAdjustment.mutate(adj.id)}
                  isApproving={approveForBudget.isPending}
                  isEffectuating={effectuateSalaries.isPending}
                  isDeleting={deleteAdjustment.isPending}
                  onReplaceScenario={() => replaceApprovedScenario.mutate({ newId: adj.id, fiscalYear: adj.fiscal_year })}
                  onRevertToSimulation={() => revertToSimulation.mutate(adj.id)}
                  isReverting={revertToSimulation.isPending}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Simulation Dialog */}
      <SalarySimulationDialog 
        open={showSimulationDialog} 
        onOpenChange={setShowSimulationDialog} 
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">funcionários ativos</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
              Abaixo da Faixa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{stats.below}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? ((stats.below / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">
              Dentro da Faixa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{stats.within}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? ((stats.within / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">
              Acima da Faixa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">{stats.above}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? ((stats.above / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição Geral</CardTitle>
            <CardDescription>Percentual de funcionários por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Análise por Grade</CardTitle>
            <CardDescription>Distribuição de funcionários por nível</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="below" name="Abaixo" fill={COLORS.below} />
                <Bar dataKey="within" name="Dentro" fill={COLORS.within} />
                <Bar dataKey="above" name="Acima" fill={COLORS.above} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats.below > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{stats.below} funcionário(s)</strong> estão com salários abaixo da faixa mínima.
            Recomenda-se revisão imediata para manter a competitividade.
          </AlertDescription>
        </Alert>
      )}

      {stats.above > 0 && (
        <Alert className="border-orange-200 dark:border-orange-900">
          <TrendingUp className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-600 dark:text-orange-400">
            <strong>{stats.above} funcionário(s)</strong> estão acima da faixa máxima.
            Considere reavaliação da grade ou justificativa especial.
          </AlertDescription>
        </Alert>
      )}

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Funcionário</CardTitle>
          <CardDescription>Visualização detalhada do posicionamento salarial</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todos ({stats.total})</TabsTrigger>
              <TabsTrigger value="below">Abaixo ({stats.below})</TabsTrigger>
              <TabsTrigger value="within">Dentro ({stats.within})</TabsTrigger>
              <TabsTrigger value="above">Acima ({stats.above})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <div className="space-y-4">
                {filteredEmployees?.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{emp.full_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {emp.employee_number}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {emp.job_title} • Grade {emp.grade}
                        </p>
                      </div>

                      <div className="flex flex-col md:flex-row gap-4 md:items-center">
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold">{formatCurrency(emp.salary)}</span>
                          </div>
                          {emp.min_value && emp.max_value && (
                            <p className="text-xs text-muted-foreground">
                              Faixa: {formatCurrency(emp.min_value)} - {formatCurrency(emp.max_value)}
                            </p>
                          )}
                        </div>

                        <Badge
                          variant="outline"
                          className={`
                            ${emp.category === 'below' ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300' : ''}
                            ${emp.category === 'within' ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900 text-green-700 dark:text-green-300' : ''}
                            ${emp.category === 'above' ? 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-900 text-orange-700 dark:text-orange-300' : ''}
                          `}
                        >
                          {emp.salary_range_percentage.toFixed(1)}%
                          {emp.deviation > 0 && (
                            <span className="ml-1">
                              ({emp.category === 'below' ? '-' : '+'}{emp.deviation.toFixed(1)}%)
                            </span>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredEmployees?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum funcionário nesta categoria
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
