import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Save } from 'lucide-react';
import { useBudgetProjections } from '@/hooks/useBudgetProjections';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AddChangeDialog } from './AddChangeDialog';
import { toast } from 'sonner';

interface EmployeeBudgetDialogProps {
  employeeId: string | null;
  employeeName: string;
  fiscalYear: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const EmployeeBudgetDialog = ({
  employeeId,
  employeeName,
  fiscalYear,
  open,
  onOpenChange,
}: EmployeeBudgetDialogProps) => {
  const [addChangeDialogOpen, setAddChangeDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const { data: projections, isLoading } = useBudgetProjections(employeeId, fiscalYear);

  const handleAddChange = (month: number) => {
    setSelectedMonth(month);
    setAddChangeDialogOpen(true);
  };

  const handleSaveChange = () => {
    setAddChangeDialogOpen(false);
    setSelectedMonth(null);
    toast.success('Alteração salva com sucesso!');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Orçamento {fiscalYear} - {employeeName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Mês</TableHead>
                      <TableHead className="text-right">Salário Fixo</TableHead>
                      <TableHead className="text-right">Variável</TableHead>
                      <TableHead className="text-right">Benefícios</TableHead>
                      <TableHead className="text-right">Total Cash</TableHead>
                      <TableHead>Tipo de Alteração</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projections?.map((proj) => {
                      const totalCash = proj.projected_fixed_salary + proj.projected_variable_salary;
                      const hasChange = !!proj.change_type;

                      return (
                        <TableRow key={proj.month} className={hasChange ? 'bg-accent/50' : ''}>
                          <TableCell className="font-medium">{monthNames[proj.month - 1]}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(proj.projected_fixed_salary)}
                            {proj.warningMessage && (
                              <div className="text-xs text-destructive mt-1">
                                {proj.warningMessage}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(proj.projected_variable_salary)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(proj.projected_benefits)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(totalCash)}
                          </TableCell>
                          <TableCell>
                            {hasChange ? (
                              <Badge variant="secondary">
                                {proj.change_type === 'merit_increase' && '🎯 Mérito'}
                                {proj.change_type === 'promotion' && '🚀 Promoção'}
                                {proj.change_type === 'collective_bargaining' && '📈 Acordo Coletivo'}
                                {proj.change_type === 'planned_termination' && '❌ Demissão'}
                                {proj.change_type === 'transfer_out' && '🔄 Transferência'}
                                {proj.change_type === 'adjustment' && '✏️ Ajuste Manual'}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAddChange(proj.month)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddChangeDialog
        open={addChangeDialogOpen}
        onOpenChange={setAddChangeDialogOpen}
        employeeId={employeeId}
        employeeName={employeeName}
        month={selectedMonth}
        fiscalYear={fiscalYear}
        onSave={handleSaveChange}
      />
    </>
  );
};
