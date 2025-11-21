import { useState, useCallback } from 'react';
import { useBenefitsHistoryByUnit } from '@/hooks/useBenefitsHistoryByUnit';
import { UnitComparisonFilter } from './UnitComparisonFilter';
import { ComparisonKPICards } from './ComparisonKPICards';
import { UnitComparisonCharts } from './UnitComparisonCharts';
import { UnitComparisonTable } from './UnitComparisonTable';
import { TrendAnalysisSection } from './TrendAnalysisSection';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const BenefitsComparisonDashboard = () => {
  const [filters, setFilters] = useState({
    unitType: null as string | null,
    selectedUnitIds: [] as string[],
    monthsBack: 12,
  });

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
  }, []);

  const { data: unitsData, isLoading, error } = useBenefitsHistoryByUnit({
    monthsBack: filters.monthsBack,
    unitType: filters.unitType,
    selectedUnitIds: filters.selectedUnitIds,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <Skeleton className="h-48 w-full" />
        </Card>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>Erro ao carregar dados de comparação. Tente novamente.</p>
        </div>
      </Card>
    );
  }

  const showEmptyState = filters.selectedUnitIds.length === 0;
  const showMinimumWarning = filters.selectedUnitIds.length === 1;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <UnitComparisonFilter onFilterChange={handleFilterChange} />

      {/* Estados vazios e avisos */}
      {showEmptyState && (
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">Selecione Unidades para Comparar</h3>
            <p className="text-muted-foreground">
              Escolha pelo menos 2 unidades organizacionais acima para visualizar gráficos e análises comparativas.
            </p>
          </div>
        </Card>
      )}

      {showMinimumWarning && (
        <Card className="p-6 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <AlertCircle className="h-5 w-5" />
            <p>Selecione pelo menos mais 1 unidade para visualizar comparações.</p>
          </div>
        </Card>
      )}

      {/* Conteúdo principal */}
      {!showEmptyState && !showMinimumWarning && unitsData && unitsData.length > 0 && (
        <>
          {/* KPI Cards */}
          <ComparisonKPICards unitsData={unitsData} />

          {/* Gráficos de Comparação */}
          <UnitComparisonCharts unitsData={unitsData} />

          {/* Tabela Comparativa */}
          <UnitComparisonTable unitsData={unitsData} />

          {/* Análise de Tendências */}
          <TrendAnalysisSection unitsData={unitsData} />
        </>
      )}

      {/* Estado vazio após filtros aplicados */}
      {!showEmptyState && !showMinimumWarning && unitsData && unitsData.length === 0 && (
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">Nenhum Dado Disponível</h3>
            <p className="text-muted-foreground">
              As unidades selecionadas não possuem funcionários com benefícios atribuídos no período escolhido.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
