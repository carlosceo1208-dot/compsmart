import { AnalyticsFiltersProvider } from '@/contexts/AnalyticsFiltersContext';
import { FilterPanel } from '@/components/analytics/FilterPanel';
import { KPICard } from '@/components/analytics/KPICard';
import { ChartCard } from '@/components/analytics/ChartCard';
import { EmployeeListCard } from '@/components/analytics/EmployeeListCard';
import { SalaryDistributionCard } from '@/components/analytics/SalaryDistributionCard';
import { usePeopleAnalytics } from '@/hooks/usePeopleAnalytics';
import { DollarSign, Users, Wallet, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency } from '@/lib/formatters';

const PeopleAnalyticsContent = () => {
  const { kpis, charts, topSalaries } = usePeopleAnalytics();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">People Analytics</h1>
        <p className="text-muted-foreground">
          Indicadores de remuneração, diversidade e estrutura organizacional
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Filters */}
        <div className="lg:col-span-3">
          <FilterPanel />
        </div>

        {/* Center: KPIs and Charts */}
        <div className="lg:col-span-6 space-y-6">
          {/* KPIs Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              title="Média Salarial"
              value={kpis.avgSalary}
              icon={DollarSign}
              format="compact-currency"
              isLoading={kpis.isLoading}
            />
            <KPICard
              title="Total de Funcionários"
              value={kpis.totalEmployees}
              icon={Users}
              format="number"
              isLoading={kpis.isLoading}
            />
            <KPICard
              title="Massa Salarial"
              value={kpis.totalSalary}
              icon={Wallet}
              format="compact-currency"
              isLoading={kpis.isLoading}
            />
          </div>

          {/* Salary Range Distribution */}
          <SalaryDistributionCard
            data={charts.salaryRangeDistribution || []}
            isLoading={charts.isLoading}
          />

          {/* Chart: Distribution by Unit */}
          <ChartCard
            title="Distribuição Salarial por Unidade"
            description="Massa salarial total por unidade organizacional (Top 10)"
            isLoading={charts.isLoading}
            isEmpty={!charts.distributionByUnit || charts.distributionByUnit.length === 0}
          >
            <ChartContainer
              config={{
                massa_salarial: {
                  label: 'Massa Salarial',
                  color: 'hsl(var(--primary))',
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.distributionByUnit}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="unidade"
                    className="text-xs"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis className="text-xs" />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(value as number)}
                      />
                    }
                  />
                  <Bar dataKey="massa_salarial" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </ChartCard>

          {/* Chart: Distribution by Grade */}
          <ChartCard
            title="Distribuição por Grade"
            description="Quantidade de funcionários e média salarial por grade"
            isLoading={charts.isLoading}
            isEmpty={!charts.distributionByGrade || charts.distributionByGrade.length === 0}
          >
            <ChartContainer
              config={{
                total: {
                  label: 'Total Funcionários',
                  color: 'hsl(var(--primary))',
                },
                media: {
                  label: 'Média Salarial',
                  color: 'hsl(var(--secondary))',
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.distributionByGrade} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="grade" type="category" className="text-xs" width={60} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="total" fill="hsl(var(--primary))" name="Funcionários" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </ChartCard>

          {/* Chart: Salary vs Range */}
          <ChartCard
            title="Comparação: Salário Real vs Faixa Salarial"
            description="Média dos salários reais comparada com a mediana da faixa salarial"
            isLoading={charts.isLoading}
            isEmpty={!charts.salaryVsRange || charts.salaryVsRange.length === 0}
          >
            <ChartContainer
              config={{
                salario_real: {
                  label: 'Salário Real',
                  color: 'hsl(var(--primary))',
                },
                faixa_mediana: {
                  label: 'Faixa Mediana',
                  color: 'hsl(var(--chart-2))',
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.salaryVsRange}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="grade" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(value as number)}
                      />
                    }
                  />
                  <Legend />
                  <Bar dataKey="salario_real" fill="hsl(var(--primary))" name="Salário Real" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="faixa_mediana" fill="hsl(var(--chart-2))" name="Faixa Mediana" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </ChartCard>
        </div>

        {/* Right Panel: Top Salaries */}
        <div className="lg:col-span-3">
          <EmployeeListCard
            employees={topSalaries.data}
            isLoading={topSalaries.isLoading}
            limit={10}
          />
        </div>
      </div>
    </div>
  );
};

const PeopleAnalytics = () => {
  return (
    <AnalyticsFiltersProvider>
      <PeopleAnalyticsContent />
    </AnalyticsFiltersProvider>
  );
};

export default PeopleAnalytics;
