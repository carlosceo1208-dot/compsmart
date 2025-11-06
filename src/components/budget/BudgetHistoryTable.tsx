import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { useBudgetHistory } from '@/hooks/useBudgetHistory';
import { useBudgetFilters } from '@/contexts/BudgetFiltersContext';
import { BudgetDialog } from './BudgetDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const BudgetHistoryTable = () => {
  const { filters } = useBudgetFilters();
  const { data: history, isLoading } = useBudgetHistory(filters);
  const queryClient = useQueryClient();
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [deletingBudget, setDeletingBudget] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budget').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-history'] });
      queryClient.invalidateQueries({ queryKey: ['kpi-budget'] });
      toast.success('Orçamento excluído');
      setDeletingBudget(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum orçamento cadastrado para os filtros selecionados.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Período</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead className="text-right">Salários Orçados</TableHead>
              <TableHead className="text-right">Salários Reais</TableHead>
              <TableHead className="text-right">Headcount Orçado</TableHead>
              <TableHead className="text-right">Headcount Real</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((budget) => {
              const isOverBudgetSalary = budget.salaryVariance > 0;
              const isOverBudgetHeadcount = budget.headcountVariance > 0;
              const isOverBudget = isOverBudgetSalary || isOverBudgetHeadcount;

              return (
                <TableRow key={budget.id}>
                  <TableCell className="font-medium">
                    {months[budget.month - 1]}/{budget.fiscal_year}
                  </TableCell>
                  <TableCell>
                    {budget.organizational_structure?.description || 'Total da Empresa'}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(budget.budgeted_salary)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span>{formatCurrency(budget.realSalary)}</span>
                      <span className={`text-xs ${isOverBudgetSalary ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {isOverBudgetSalary ? '+' : ''}{formatCurrency(budget.salaryVariance)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(budget.budgeted_headcount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span>{formatNumber(budget.realHeadcount)}</span>
                      <span className={`text-xs ${isOverBudgetHeadcount ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {isOverBudgetHeadcount ? '+' : ''}{budget.headcountVariance}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={isOverBudget ? 'destructive' : 'success'}>
                      {isOverBudget ? '⚠️ Acima' : '✅ Dentro'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingBudget(budget)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingBudget(budget.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <BudgetDialog
        open={!!editingBudget}
        onOpenChange={(open) => !open && setEditingBudget(null)}
        budgetData={editingBudget}
        mode="edit"
      />

      <AlertDialog open={!!deletingBudget} onOpenChange={(open) => !open && setDeletingBudget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingBudget && deleteMutation.mutate(deletingBudget)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
