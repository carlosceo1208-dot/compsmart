import { ChartCard } from './ChartCard';
import { KPICard } from './KPICard';
import { usePointsDistribution } from '@/hooks/usePointsDistribution';
import { Target, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export const PointsDistributionSection = () => {
  const { 
    pointsByGrade, 
    pointsByFamily, 
    pointsByDepartment, 
    pointsKPIs, 
    inconsistencies,
    isLoading 
  } = usePointsDistribution();

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-1">
          <Target className="h-5 w-5 text-primary" />
          Distribuição de Pontos de Avaliação
        </h2>
        <p className="text-sm text-muted-foreground">
          Análise da complexidade e peso dos cargos na estrutura organizacional
        </p>
      </div>

      {/* Points KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Média de Pontos"
          value={pointsKPIs.data?.avgPoints || 0}
          icon={Target}
          format="number"
          isLoading={pointsKPIs.isLoading}
        />
        <KPICard
          title="Cargos Avaliados"
          value={pointsKPIs.data?.jobsWithPoints || 0}
          icon={CheckCircle}
          format="number"
          isLoading={pointsKPIs.isLoading}
          variant="success"
        />
        <KPICard
          title="Sem Avaliação"
          value={pointsKPIs.data?.jobsWithoutPoints || 0}
          icon={AlertTriangle}
          format="number"
          isLoading={pointsKPIs.isLoading}
          variant={pointsKPIs.data?.jobsWithoutPoints ? "warning" : "default"}
        />
        <KPICard
          title="Cobertura"
          value={pointsKPIs.data?.coveragePercent || 0}
          icon={TrendingUp}
          format="percentage"
          isLoading={pointsKPIs.isLoading}
          variant={
            (pointsKPIs.data?.coveragePercent || 0) >= 80 
              ? "success" 
              : (pointsKPIs.data?.coveragePercent || 0) >= 50 
                ? "warning" 
                : "warning"
          }
        />
      </div>

      {/* Inconsistencies Alerts */}
      {inconsistencies.data && inconsistencies.data.length > 0 && (
        <div className="space-y-2">
          {inconsistencies.data.map((issue, index) => (
            <Alert key={index} variant={issue.severity === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="flex items-center gap-2">
                {issue.description}
                <Badge variant={issue.severity === 'error' ? 'destructive' : 'secondary'}>
                  {issue.type === 'grade_variation' ? 'Variação' : 'Pendente'}
                </Badge>
              </AlertTitle>
              <AlertDescription>{issue.details}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Chart: Points by Grade */}
      <ChartCard
        title="Distribuição de Pontos por Grade"
        description="Média, mínimo e máximo de pontos de avaliação por grade"
        isLoading={pointsByGrade.isLoading}
        isEmpty={!pointsByGrade.data || pointsByGrade.data.length === 0}
      >
        <ChartContainer
          config={{
            avgPoints: {
              label: 'Média de Pontos',
              color: 'hsl(var(--primary))',
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pointsByGrade.data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis 
                dataKey="grade" 
                type="category" 
                className="text-xs" 
                width={60} 
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent
                    formatter={(value, name, props) => {
                      const item = props.payload;
                      return (
                        <div className="space-y-1">
                          <div>Média: {item.avgPoints} pts</div>
                          <div className="text-xs text-muted-foreground">
                            Mín: {item.minPoints} | Máx: {item.maxPoints}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.count} cargo(s)
                          </div>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Bar dataKey="avgPoints" radius={[0, 4, 4, 0]}>
                {pointsByGrade.data?.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.hasInconsistency 
                      ? 'hsl(var(--destructive))' 
                      : 'hsl(var(--primary))'
                    } 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </ChartCard>

      {/* Chart: Points by Job Family */}
      <ChartCard
        title="Distribuição de Pontos por Família de Cargos"
        description="Média de pontos por família de cargos"
        isLoading={pointsByFamily.isLoading}
        isEmpty={!pointsByFamily.data || pointsByFamily.data.length === 0}
      >
        <ChartContainer
          config={{
            avgPoints: {
              label: 'Média de Pontos',
              color: 'hsl(var(--chart-2))',
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pointsByFamily.data?.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="family" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis className="text-xs" />
              <ChartTooltip 
                content={
                  <ChartTooltipContent
                    formatter={(value, name, props) => {
                      const item = props.payload;
                      return (
                        <div className="space-y-1">
                          <div>{item.avgPoints} pontos (média)</div>
                          <div className="text-xs text-muted-foreground">
                            {item.count} cargo(s) na família
                          </div>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Bar dataKey="avgPoints" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </ChartCard>

      {/* Chart: Points by Department */}
      <ChartCard
        title="Distribuição de Pontos por Departamento"
        description="Média de pontos dos colaboradores por unidade organizacional (Top 10)"
        isLoading={pointsByDepartment.isLoading}
        isEmpty={!pointsByDepartment.data || pointsByDepartment.data.length === 0}
      >
        <ChartContainer
          config={{
            avgPoints: {
              label: 'Média de Pontos',
              color: 'hsl(var(--chart-3))',
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pointsByDepartment.data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="department" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis className="text-xs" />
              <ChartTooltip 
                content={
                  <ChartTooltipContent
                    formatter={(value, name, props) => {
                      const item = props.payload;
                      return (
                        <div className="space-y-1">
                          <div>{item.avgPoints} pontos (média)</div>
                          <div className="text-xs text-muted-foreground">
                            {item.count} colaborador(es)
                          </div>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Bar dataKey="avgPoints" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </ChartCard>
    </div>
  );
};
