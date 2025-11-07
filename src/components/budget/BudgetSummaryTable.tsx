import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';

interface MonthlySummary {
  month: number;
  totalFixed: number;
  totalVariable: number;
  totalCash: number;
  totalBenefits: number;
  headcount: number;
}

interface BudgetSummaryTableProps {
  monthlyTotals: MonthlySummary[];
  yearTotal: number;
  avgHeadcount: number;
  isLoading?: boolean;
}

const monthNames = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const BudgetSummaryTable = ({
  monthlyTotals,
  yearTotal,
  avgHeadcount,
  isLoading,
}: BudgetSummaryTableProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resumo Consolidado</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Resumo Consolidado (Total da Unidade)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Fixo (R$)</TableHead>
                <TableHead className="text-right">Variável (R$)</TableHead>
                <TableHead className="text-right">Total Cash</TableHead>
                <TableHead className="text-right">Benefícios</TableHead>
                <TableHead className="text-right">Headcount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyTotals.map((summary) => (
                <TableRow key={summary.month}>
                  <TableCell className="font-medium">
                    {monthNames[summary.month - 1]}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(summary.totalFixed)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(summary.totalVariable)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(summary.totalCash)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(summary.totalBenefits)}
                  </TableCell>
                  <TableCell className="text-right">
                    {summary.headcount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex justify-between items-center border-t pt-4">
          <div className="text-lg font-semibold">
            Total Ano: {formatCurrency(yearTotal)}
          </div>
          <div className="text-sm text-muted-foreground">
            Headcount Médio: {avgHeadcount} pessoas
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
