/**
 * ✅ MIGRADO: Formatação centralizada implementada
 * Data: 2025-01-20
 * 
 * Todas as formatações monetárias agora usam @/lib/formatters
 * para prevenir RangeError e garantir consistência.
 */
import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { UnitBenefitsHistory } from '@/hooks/useBenefitsHistoryByUnit';
import { formatCurrency, formatPercentage, formatDecimal } from '@/lib/formatters';

interface UnitComparisonChartsProps {
  unitsData: UnitBenefitsHistory[];
}

const UNIT_COLORS = [
  'hsl(221, 83%, 53%)',   // Azul
  'hsl(20, 100%, 50%)',   // Laranja
  'hsl(142, 71%, 45%)',   // Verde
  'hsl(280, 61%, 50%)',   // Roxo
  'hsl(355, 70%, 54%)',   // Vermelho
];

const CustomDistributionTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div 
      className="bg-background border rounded-lg shadow-lg p-3 space-y-2"
      style={{
        backgroundColor: 'hsl(var(--background))',
        border: '1px solid hsl(var(--border))',
      }}
    >
      <div className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: data.color }}
        />
        <span className="font-semibold">{data.name}</span>
      </div>
      
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Custo Total:</span>
          <span className="font-semibold">{formatCurrency(data.value)}</span>
        </div>
        
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">% do Total:</span>
          <span className="font-semibold">{formatPercentage(data.percentage)}</span>
        </div>
        
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Funcionários:</span>
          <span className="font-semibold">{data.employeesCount}</span>
        </div>
      </div>
    </div>
  );
};

export const UnitComparisonCharts = ({ unitsData }: UnitComparisonChartsProps) => {
  if (unitsData.length === 0) return null;

  // Preparar dados para o gráfico de evolução de custos totais
  const months = unitsData[0]?.history.map(h => h.month) || [];
  const evolutionData = months.map((month) => {
    const dataPoint: any = { month };
    unitsData.forEach((unit) => {
      const monthData = unit.history.find(h => h.month === month);
      dataPoint[unit.unitName] = monthData?.totalCost || 0;
    });
    return dataPoint;
  });

  // Preparar dados para o gráfico de distribuição (donut)
  const distributionData = unitsData.map((unit, index) => {
    const lastMonth = unit.history[unit.history.length - 1];
    const totalCost = lastMonth?.totalCost || 0;
    
    return {
      name: unit.unitName,
      value: totalCost,
      color: UNIT_COLORS[index % UNIT_COLORS.length],
      employeesCount: lastMonth?.employeesCount || 0,
    };
  });

  const totalCost = distributionData.reduce((sum, item) => sum + item.value, 0);
  
  const distributionDataWithPercentage = distributionData.map(item => ({
    ...item,
    percentage: totalCost > 0 ? (item.value / totalCost) * 100 : 0,
  }));

  // Preparar dados para o gráfico stacked (empresa vs funcionário)
  const lastMonthData = unitsData.map((unit) => {
    const lastMonth = unit.history[unit.history.length - 1];
    return {
      name: unit.unitName,
      companyCost: lastMonth?.companyCost || 0,
      employeeCost: lastMonth?.employeeCost || 0,
      totalCost: lastMonth?.totalCost || 0,
    };
  });

  // Preparar dados para o gráfico de funcionários
  const employeesData = months.map((month) => {
    const dataPoint: any = { month };
    unitsData.forEach((unit) => {
      const monthData = unit.history.find(h => h.month === month);
      dataPoint[unit.unitName] = monthData?.employeesCount || 0;
    });
    return dataPoint;
  });

  return (
    <div className="space-y-6">
      {/* Gráfico de Evolução de Custos Totais */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Evolução de Custos Totais por Unidade</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={evolutionData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" tickFormatter={(value) => `R$ ${formatDecimal(value / 1000, 0)}k`} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            {unitsData.map((unit, index) => (
              <Line
                key={unit.unitId}
                type="monotone"
                dataKey={unit.unitName}
                stroke={UNIT_COLORS[index % UNIT_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Gráfico de Distribuição de Custos (Donut) */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Distribuição de Custos por Unidade</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Proporção percentual do custo total de benefícios (último mês)
        </p>
        
        {distributionDataWithPercentage.length < 2 ? (
          <p className="text-sm text-muted-foreground italic text-center py-8">
            Selecione pelo menos 2 unidades para visualizar a distribuição.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Gráfico de Pizza/Donut */}
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={distributionDataWithPercentage}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percentage }) => 
                    `${name}: ${formatDecimal(percentage, 1)}%`
                  }
                  labelLine={true}
                  animationBegin={0}
                  animationDuration={800}
                >
                  {distributionDataWithPercentage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomDistributionTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Card Central com Total e Ranking */}
            <div className="flex flex-col justify-center space-y-4">
              <div className="text-center p-6 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Custo Total Geral
                </p>
                <p className="text-3xl font-bold">
                  {formatCurrency(totalCost)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {distributionData.length} unidades comparadas
                </p>
              </div>

              {/* Lista de unidades ordenadas por custo */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Ranking de Custos</h4>
                {distributionDataWithPercentage
                  .sort((a, b) => b.value - a.value)
                  .map((unit, index) => (
                    <div 
                      key={unit.name} 
                      className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: unit.color }}
                        />
                        <span className="text-sm font-medium">
                          {index + 1}º {unit.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(unit.value)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDecimal(unit.percentage, 1)}%
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Gráfico Stacked: Empresa vs Funcionário */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Custo Empresa vs Funcionário (Último Mês)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={lastMonthData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" tickFormatter={(value) => `R$ ${formatDecimal(value / 1000, 0)}k`} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="companyCost" stackId="a" fill="hsl(var(--primary))" name="Custo Empresa" />
            <Bar dataKey="employeeCost" stackId="a" fill="hsl(20, 100%, 50%)" name="Custo Funcionário" />
          </BarChart>
        </ResponsiveContainer>

        {/* Cards de detalhes por unidade */}
        <div className="grid gap-4 md:grid-cols-3 mt-6">
          {lastMonthData.slice(0, 3).map((unit, index) => (
            <Card key={unit.name} className="p-4 border-l-4" style={{ borderLeftColor: UNIT_COLORS[index] }}>
              <h4 className="font-semibold text-sm mb-2">{unit.name}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-semibold">{formatCurrency(unit.totalCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Empresa:</span>
                  <span>{formatCurrency(unit.companyCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Funcionário:</span>
                  <span>{formatCurrency(unit.employeeCost)}</span>
                </div>
                <div className="pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    {formatPercentage((unit.companyCost / unit.totalCost) * 100)} empresa / {' '}
                    {formatPercentage((unit.employeeCost / unit.totalCost) * 100)} func.
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Gráfico de Evolução de Funcionários */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Evolução de Funcionários com Benefícios</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={employeesData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            {unitsData.map((unit, index) => (
              <Area
                key={unit.unitId}
                type="monotone"
                dataKey={unit.unitName}
                stroke={UNIT_COLORS[index % UNIT_COLORS.length]}
                fill={UNIT_COLORS[index % UNIT_COLORS.length]}
                fillOpacity={0.3}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
