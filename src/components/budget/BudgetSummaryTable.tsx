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
  // Calcular totais por coluna
  const totalFixed = monthlyTotals.reduce((sum, m) => sum + m.totalFixed, 0);
  const totalVariable = monthlyTotals.reduce((sum, m) => sum + m.totalVariable, 0);
  const totalBenefits = monthlyTotals.reduce((sum, m) => sum + m.totalBenefits, 0);

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
              {/* Linha de TOTAL */}
              <TableRow className="bg-primary/10 font-bold border-t-2">
                <TableCell className="font-bold">TOTAL</TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(totalFixed)}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(totalVariable)}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(yearTotal)}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(totalBenefits)}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {avgHeadcount}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
