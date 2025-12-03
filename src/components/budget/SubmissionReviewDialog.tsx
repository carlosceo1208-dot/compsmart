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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle, Loader2, Info, Check, Trophy, BarChart3, TrendingUp, UserPlus } from 'lucide-react';
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
  const [selfApprovalJustification, setSelfApprovalJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUserRole();
  const { data: details, isLoading } = useBudgetSubmissionDetail(submissionId);

  const handleApprove = async () => {
    if (!userData?.userId) return;

    setIsSubmitting(true);
    try {
      // Detectar auto-aprovação
      const isSelfApproval = details.submission.submitted_by === userData.userId;
      
      // Se for auto-aprovação e não houver justificativa, bloquear
      if (isSelfApproval && !selfApprovalJustification.trim()) {
        toast.error('⚠️ Auto-aprovação requer justificativa detalhada');
        setIsSubmitting(false);
        return;
      }

      if (isSelfApproval && selfApprovalJustification.length < 50) {
        toast.error('⚠️ Justificativa deve ter no mínimo 50 caracteres');
        setIsSubmitting(false);
        return;
      }

      // Verificar se há superior configurado
      const { data: approverConfig } = await supabase
        .from('budget_approvers')
        .select('superior_approver_id, can_self_approve')
        .eq('user_id', userData.userId)
        .maybeSingle();

      // Se tem superior e está tentando auto-aprovar, bloquear
      if (isSelfApproval && approverConfig?.superior_approver_id) {
        const { data: superiorProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', approverConfig.superior_approver_id)
          .single();
        
        toast.error(`⚠️ Este orçamento requer aprovação de: ${superiorProfile?.full_name || 'Aprovador Superior'}`);
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('budget_submissions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: userData.userId,
          review_notes: reviewNotes || null,
          is_self_approval: isSelfApproval,
          self_approval_justification: isSelfApproval ? selfApprovalJustification : null,
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast.success(isSelfApproval 
        ? '✅ Auto-aprovação registrada com justificativa' 
        : '✅ Orçamento aprovado com sucesso!'
      );
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

  // Detectar auto-aprovação
  const isSelfApproval = details.submission.submitted_by === userData?.userId;

  // Calcular progresso da justificativa
  const justificationProgress = Math.min((selfApprovalJustification.length / 50) * 100, 100);
  const isJustificationValid = selfApprovalJustification.length >= 50;

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
              Funcionários ({(details.salaryChanges?.length || 0) + (details.promotions?.length || 0) + (details.plannedHires?.length || 0)})
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

          {/* Aba: Funcionários com Alterações - Reorganizada em 3 seções */}
          <TabsContent value="employees" className="space-y-6">
            {/* Seção 1: Aumentos Salariais */}
            {details.salaryChanges && details.salaryChanges.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Trophy className="h-5 w-5 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Aumentos Salariais</h3>
                  <Badge variant="secondary" className="ml-2">{details.salaryChanges.length}</Badge>
                </div>
                <div className="space-y-3">
                  {details.salaryChanges.map((emp: any, idx: number) => {
                    const currentSalary = emp.employee?.salary || 0;
                    const projectedSalary = emp.changes[0]?.projected_fixed_salary || 0;
                    const percentChange = currentSalary > 0 
                      ? ((projectedSalary - currentSalary) / currentSalary) * 100 
                      : 0;
                    
                    return (
                      <div key={idx} className="border rounded-lg p-4 space-y-3 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
                        <div className="flex items-start justify-between">
                          <div>
                            {getChangeTypeBadge(emp.changeType)}
                            <h4 className="font-semibold text-lg mt-2">{emp.employee?.full_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {emp.employee?.job_title} • Grade {emp.employee?.grade}
                            </p>
                          </div>
                          <span className={`font-bold text-lg ${emp.totalImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {emp.totalImpact >= 0 ? '+' : ''}{formatCurrency(emp.totalImpact)}
                          </span>
                        </div>
                        
                        {/* Detalhes do aumento */}
                        <div className="bg-white dark:bg-background/50 rounded-lg p-3 border">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              <strong>{getMonthName(emp.changes[0]?.month)}</strong> - Salário
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-muted-foreground">{formatCurrency(currentSalary)}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-mono font-semibold">{formatCurrency(projectedSalary)}</span>
                              <Badge className={`ml-2 ${percentChange > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
                                {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {emp.changes[0]?.justification && (
                          <p className="text-sm text-muted-foreground italic border-l-2 border-amber-300 pl-3">
                            {emp.changes[0].justification}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Seção 2: Promoções de Cargo */}
            {details.promotions && details.promotions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Promoções de Cargo</h3>
                  <Badge variant="secondary" className="ml-2">{details.promotions.length}</Badge>
                </div>
                <div className="space-y-3">
                  {details.promotions.map((emp: any, idx: number) => {
                    const currentSalary = emp.employee?.salary || 0;
                    const projectedSalary = emp.changes[0]?.projected_fixed_salary || 0;
                    const percentChange = currentSalary > 0 
                      ? ((projectedSalary - currentSalary) / currentSalary) * 100 
                      : 0;
                    
                    return (
                      <div key={idx} className="border rounded-lg p-4 space-y-3 bg-purple-50/50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800">
                        <div className="flex items-start justify-between">
                          <div>
                            {getChangeTypeBadge('promotion')}
                            <h4 className="font-semibold text-lg mt-2">{emp.employee?.full_name}</h4>
                          </div>
                          <span className="font-bold text-lg text-green-600">
                            +{formatCurrency(emp.totalImpact)}
                          </span>
                        </div>
                        
                        {/* Transição de cargo */}
                        <div className="bg-white dark:bg-background/50 rounded-lg p-3 border">
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex-1">
                              <p className="text-muted-foreground text-xs">Cargo Atual</p>
                              <p className="font-medium">{emp.employee?.job_title} ({emp.employee?.grade})</p>
                            </div>
                            <TrendingUp className="h-5 w-5 text-purple-500" />
                            <div className="flex-1">
                              <p className="text-muted-foreground text-xs">Novo Cargo</p>
                              <p className="font-medium">{emp.changes[0]?.projected_job_title?.title} ({emp.changes[0]?.projected_grade})</p>
                            </div>
                          </div>
                        </div>

                        {/* Detalhes salariais */}
                        <div className="flex items-center justify-between text-sm bg-white dark:bg-background/50 rounded-lg p-3 border">
                          <span className="text-muted-foreground">
                            <strong>{getMonthName(emp.changes[0]?.month)}</strong> - Novo Salário
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-muted-foreground">{formatCurrency(currentSalary)}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-mono font-semibold">{formatCurrency(projectedSalary)}</span>
                            <Badge className="ml-2 bg-purple-100 text-purple-700 dark:bg-purple-900/30">
                              +{percentChange.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>

                        {emp.changes[0]?.justification && (
                          <p className="text-sm text-muted-foreground italic border-l-2 border-purple-300 pl-3">
                            {emp.changes[0].justification}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Seção 3: Novas Contratações Planejadas */}
            {details.plannedHires && details.plannedHires.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <UserPlus className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Novas Contratações Planejadas</h3>
                  <Badge variant="secondary" className="ml-2">{details.plannedHires.length}</Badge>
                </div>
                <div className="space-y-3">
                  {details.plannedHires.map((hire: any, idx: number) => {
                    const monthsCount = 12 - hire.month + 1;
                    const monthlyTotal = (hire.projected_fixed_salary || 0) + 
                                       (hire.projected_variable_salary || 0) + 
                                       (hire.projected_benefits || 0);
                    const totalImpact = monthlyTotal * monthsCount;

                    return (
                      <div key={idx} className="border rounded-lg p-4 space-y-3 bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-start justify-between">
                          <div>
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30">
                              <UserPlus className="h-3 w-3 mr-1" />
                              NOVA CONTRATAÇÃO
                            </Badge>
                            <h4 className="font-semibold text-lg mt-2">{hire.planned_employee_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {hire.projected_job_title?.title} • Grade {hire.projected_grade}
                            </p>
                          </div>
                          <span className="font-bold text-lg text-emerald-600">
                            +{formatCurrency(totalImpact)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm bg-white dark:bg-background/50 rounded-lg p-3 border">
                          <div>
                            <span className="text-muted-foreground">Início:</span>{' '}
                            <strong>{getMonthName(hire.month)}/{details.submission.fiscal_year}</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duração:</span>{' '}
                            <strong>{monthsCount} meses</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Salário Mensal:</span>{' '}
                            <strong>{formatCurrency(monthlyTotal)}</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Impacto Anual:</span>{' '}
                            <strong className="text-emerald-600">{formatCurrency(totalImpact)}</strong>
                          </div>
                        </div>

                        {hire.justification && (
                          <p className="text-sm text-muted-foreground italic border-l-2 border-emerald-300 pl-3">
                            {hire.justification}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mensagem se não houver nada */}
            {(!details.salaryChanges || details.salaryChanges.length === 0) && 
             (!details.promotions || details.promotions.length === 0) && 
             (!details.plannedHires || details.plannedHires.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma alteração ou contratação registrada
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
        {details.submission.status === 'submitted' && (
          <div className="space-y-4 border-t pt-6">
            {isSelfApproval && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>⚠️ Auto-Aprovação Detectada</strong>
                  <p className="mt-1">
                    Você está aprovando um orçamento que você mesmo submeteu. 
                    Uma justificativa detalhada é obrigatória para fins de auditoria e compliance.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {isSelfApproval && (
              <div className="space-y-3">
                <label className={`text-sm font-semibold flex items-center gap-2 ${
                  isJustificationValid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isJustificationValid ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  Justificativa para Auto-Aprovação * (Obrigatório)
                </label>
                <Textarea
                  value={selfApprovalJustification}
                  onChange={(e) => setSelfApprovalJustification(e.target.value)}
                  placeholder="Explique detalhadamente por que esta auto-aprovação é necessária. Seja específico sobre o contexto, motivos e responsabilidade assumida..."
                  rows={5}
                  className={`transition-colors ${
                    isJustificationValid 
                      ? 'border-green-400 focus:border-green-500 bg-green-50/50' 
                      : 'border-red-300 focus:border-red-500'
                  }`}
                  required
                />
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-medium ${
                      isJustificationValid ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selfApprovalJustification.length}/50 caracteres
                    </span>
                    {isJustificationValid ? (
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Requisito atendido
                      </span>
                    ) : (
                      <span className="text-red-600">
                        Mínimo 50 caracteres necessários
                      </span>
                    )}
                  </div>
                  <Progress 
                    value={justificationProgress} 
                    className={`h-2 ${
                      isJustificationValid ? '[&>div]:bg-green-500' : '[&>div]:bg-red-500'
                    }`}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Comentários de Revisão {!isSelfApproval && '(opcional)'}
              </label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Adicione comentários sobre esta revisão..."
                rows={3}
              />
            </div>
          </div>
        )}

        {details.submission.status !== 'submitted' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Comentários de Revisão
            </label>
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Adicione comentários sobre esta revisão..."
              rows={3}
              disabled
            />
          </div>
        )}

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
              <Button onClick={handleApprove} disabled={isSubmitting || (isSelfApproval && selfApprovalJustification.length < 50)}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {isSelfApproval ? 'Aprovar (Auto-Aprovação)' : 'Aprovar'}
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

// Helper para badges coloridos por tipo de alteração
function getChangeTypeBadge(changeType: string) {
  const badges: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    merit_increase: { 
      label: 'MÉRITO', 
      className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300', 
      icon: <Trophy className="h-3 w-3 mr-1" />,
    },
    adjustment: { 
      label: 'ENQUADRAMENTO', 
      className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300', 
      icon: <BarChart3 className="h-3 w-3 mr-1" />,
    },
    promotion: { 
      label: 'PROMOÇÃO', 
      className: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300', 
      icon: <TrendingUp className="h-3 w-3 mr-1" />,
    },
    transfer: { 
      label: 'TRANSFERÊNCIA', 
      className: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300', 
      icon: null,
    },
    other: { 
      label: 'AJUSTE', 
      className: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800/30 dark:text-gray-300', 
      icon: null,
    },
  };
  
  const config = badges[changeType] || badges.other;
  
  return (
    <Badge className={config.className}>
      {config.icon}
      {config.label}
    </Badge>
  );
}
