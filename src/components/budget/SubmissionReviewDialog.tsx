import { useState } from 'react';
import { useBudgetSubmissionDetail } from '@/hooks/useBudgetSubmissionDetail';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, XCircle, Loader2, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  submissionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SubmissionReviewDialog = ({ submissionId, open, onOpenChange }: Props) => {
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUserRole();
  const { data: details, isLoading } = useBudgetSubmissionDetail(submissionId);

  const handleApprove = async () => {
    if (!userData?.userId) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('budget_submissions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: userData.userId,
          review_notes: reviewNotes || null,
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast.success('Orçamento aprovado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['budget-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['budget-submission-detail'] });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast.error('Erro ao aprovar orçamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reviewNotes.trim()) {
      toast.error('Adicione uma justificativa para rejeitar');
      return;
    }

    if (!userData?.userId) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('budget_submissions')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: userData.userId,
          review_notes: reviewNotes,
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast.success('Orçamento rejeitado');
      queryClient.invalidateQueries({ queryKey: ['budget-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['budget-submission-detail'] });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      toast.error('Erro ao rejeitar orçamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!details) return null;

  const totalYearly = details.monthlyTotals.reduce(
    (sum, month) => sum + month.totalFixed + month.totalVariable + month.totalBenefits,
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Revisão de Orçamento - {details.submission.unit?.description}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Ano Fiscal: {details.submission.fiscal_year} | 
            Total Anual: {formatCurrency(totalYearly)}
          </p>
        </DialogHeader>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Resumo Mensal</TabsTrigger>
            <TabsTrigger value="employees">
              Funcionários ({details.employeeChanges.length})
            </TabsTrigger>
            <TabsTrigger value="alerts">
              Alertas ({details.alerts.length})
            </TabsTrigger>
          </TabsList>

          {/* Aba: Resumo Consolidado */}
          <TabsContent value="summary" className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Salário Fixo</TableHead>
                    <TableHead className="text-right">Salário Variável</TableHead>
                    <TableHead className="text-right">Benefícios</TableHead>
                    <TableHead className="text-right font-bold">Total</TableHead>
                    <TableHead className="text-center">Headcount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.monthlyTotals.map((month) => {
                    const monthTotal = month.totalFixed + month.totalVariable + month.totalBenefits;
                    return (
                      <TableRow key={month.month}>
                        <TableCell className="font-medium">{getMonthName(month.month)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(month.totalFixed)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(month.totalVariable)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(month.totalBenefits)}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(monthTotal)}</TableCell>
                        <TableCell className="text-center">{month.headcount}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>TOTAL ANUAL</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(details.monthlyTotals.reduce((s, m) => s + m.totalFixed, 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(details.monthlyTotals.reduce((s, m) => s + m.totalVariable, 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(details.monthlyTotals.reduce((s, m) => s + m.totalBenefits, 0))}
                    </TableCell>
                    <TableCell className="text-right text-lg">{formatCurrency(totalYearly)}</TableCell>
                    <TableCell className="text-center">
                      {Math.max(...details.monthlyTotals.map(m => m.headcount))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Aba: Funcionários com Mudanças */}
          <TabsContent value="employees" className="space-y-4">
            {details.employeeChanges.length > 0 ? (
              details.employeeChanges.map((emp, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg">{emp.employee.full_name}</h4>
                    <span className={`font-semibold ${emp.totalImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Impacto: {formatCurrency(emp.totalImpact)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {emp.changes.map((change: any, cIdx: number) => (
                      <div key={cIdx} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                        <span>
                          <strong>{getMonthName(change.month)}</strong> - {change.change_type || 'Mudança'}
                        </span>
                        <span className="font-mono">{formatCurrency(change.projected_fixed_salary)}</span>
                      </div>
                    ))}
                  </div>
                  {emp.changes[0]?.justification && (
                    <p className="text-sm text-muted-foreground italic">
                      Justificativa: {emp.changes[0].justification}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma mudança registrada
              </div>
            )}
          </TabsContent>

          {/* Aba: Alertas Automáticos */}
          <TabsContent value="alerts" className="space-y-3">
            {details.alerts && details.alerts.length > 0 ? (
              details.alerts.map((alert, idx) => (
                <Alert key={idx} variant={alert.type === 'warning' ? 'default' : 'default'}>
                  {alert.type === 'warning' ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Info className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    <strong>{alert.employee}:</strong> {alert.message}
                  </AlertDescription>
                </Alert>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-2" />
                <p className="text-muted-foreground">Nenhum alerta detectado</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Comentários de Revisão */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Comentários de Revisão {details.submission.status === 'submitted' && '(opcional)'}
          </label>
          <Textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Adicione comentários sobre esta revisão..."
            rows={3}
            disabled={details.submission.status !== 'submitted'}
          />
        </div>

        {details.submission.review_notes && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Revisão anterior:</strong> {details.submission.review_notes}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {details.submission.status === 'submitted' ? 'Cancelar' : 'Fechar'}
          </Button>
          {details.submission.status === 'submitted' && (
            <>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Rejeitar
              </Button>
              <Button onClick={handleApprove} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Aprovar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function getMonthName(month: number): string {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return months[month - 1] || `Mês ${month}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}
