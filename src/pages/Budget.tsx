import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BudgetFiltersProvider, useBudgetFilters } from '@/contexts/BudgetFiltersContext';
import { BudgetFilterPanel } from '@/components/budget/BudgetFilterPanel';
import { BudgetDialog } from '@/components/budget/BudgetDialog';
import { BudgetHistoryTable } from '@/components/budget/BudgetHistoryTable';
import { BudgetCard } from '@/components/dashboard/BudgetCard';
import { Currency } from '@/types/economic';

const BudgetContent = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { filters } = useBudgetFilters();
  const [currency] = useState<Currency>('BRL');

  return (
    <div className="h-[calc(100vh-8rem)] overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Gestão de Orçamento</h1>
        <p className="text-muted-foreground">
          Gerencie orçamentos mensais de salários e headcount por unidade organizacional
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_350px] gap-6 mb-6">
        {/* Coluna Esquerda: Filtros */}
        <div>
          <BudgetFilterPanel />
        </div>

        {/* Coluna Central: Botão de Cadastro */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Novo Orçamento</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setDialogOpen(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Orçamento
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: KPI Card */}
        <div>
          <BudgetCard currency={currency} unitId={filters.unitId} />
        </div>
      </div>

      {/* Tabela de Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Orçamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetHistoryTable />
        </CardContent>
      </Card>

      <BudgetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode="create"
      />
    </div>
  );
};

const Budget = () => {
  return (
    <BudgetFiltersProvider>
      <BudgetContent />
    </BudgetFiltersProvider>
  );
};

export default Budget;
