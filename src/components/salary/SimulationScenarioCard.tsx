import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Clock, 
  Trash2, 
  FileCheck, 
  Play,
  Calendar,
  Users,
  DollarSign,
  Undo2,
  AlertTriangle
} from "lucide-react";
import { CollectiveAdjustment } from "@/hooks/useCollectiveAdjustments";
import { formatCurrency } from "@/lib/formatters";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SimulationScenarioCardProps {
  adjustment: CollectiveAdjustment;
  onApproveForBudget: () => Promise<void>;
  onEffectuate: () => void;
  onDelete: () => void;
  onReplaceScenario: () => void;
  onRevertToSimulation: () => void;
  isApproving?: boolean;
  isEffectuating?: boolean;
  isDeleting?: boolean;
  isReverting?: boolean;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function SimulationScenarioCard({
  adjustment,
  onApproveForBudget,
  onEffectuate,
  onDelete,
  onReplaceScenario,
  onRevertToSimulation,
  isApproving,
  isEffectuating,
  isDeleting,
  isReverting,
}: SimulationScenarioCardProps) {
  const [conflictDialog, setConflictDialog] = useState<{
    open: boolean;
    existingName: string;
    existingCost: number;
  } | null>(null);

  const handleApprove = async () => {
    try {
      await onApproveForBudget();
    } catch (error: any) {
      if (error?.code === 'SCENARIO_CONFLICT') {
        setConflictDialog({
          open: true,
          existingName: error.existing.adjustment_name,
          existingCost: error.existing.total_annual_cost,
        });
      }
    }
  };

  const handleReplaceConfirm = () => {
    setConflictDialog(null);
    onReplaceScenario();
  };

  const getStatusBadge = () => {
    switch (adjustment.status) {
      case 'simulation':
        return (
          <Badge variant="outline" className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
            <Clock className="w-3 h-3 mr-1" />
            Simulação
          </Badge>
        );
      case 'approved_budget':
        return (
          <Badge className="bg-green-600 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            ATIVO NO ORÇAMENTO
          </Badge>
        );
      case 'effectuated':
        return (
          <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Efetivado
          </Badge>
        );
    }
  };

  const getAdjustmentTypeLabel = () => {
    if (adjustment.adjustment_type === 'fixed_percentage') {
      return `${adjustment.fixed_percentage}% Fixo`;
    }
    return `Escalonado (${adjustment.scaled_rules?.length || 0} faixas)`;
  };

  return (
    <>
      <Card className={`border-2 hover:border-primary/50 transition-colors ${
        adjustment.status === 'approved_budget' ? 'border-green-500 bg-green-50/30 dark:bg-green-950/20' : ''
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{adjustment.adjustment_name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  Vigência: {MONTH_NAMES[adjustment.effective_month - 1]}/{adjustment.fiscal_year}
                </span>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                Funcionários
              </p>
              <p className="text-lg font-semibold">{adjustment.total_employees_affected}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Custo Mensal
              </p>
              <p className="text-lg font-semibold text-amber-600">
                +{formatCurrency(adjustment.total_monthly_cost)}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Custo Anual</p>
              <p className="text-lg font-semibold text-amber-600">
                +{formatCurrency(adjustment.total_annual_cost)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tipo:</span>
            <Badge variant="secondary">{getAdjustmentTypeLabel()}</Badge>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            {adjustment.status === 'simulation' && (
              <>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="flex-1"
                >
                  <FileCheck className="w-4 h-4 mr-1" />
                  {isApproving ? 'Aprovando...' : 'Aplicar ao Orçamento'}
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir simulação?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. A simulação "{adjustment.adjustment_name}" será permanentemente excluída.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

            {adjustment.status === 'approved_budget' && (
              <div className="flex gap-2 w-full">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="default"
                      disabled={isEffectuating}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      {isEffectuating ? 'Efetivando...' : 'Efetivar Salários'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Efetivar Ajuste Salarial?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação irá atualizar os salários de <strong>{adjustment.total_employees_affected} funcionários</strong>.
                        <br /><br />
                        Custo mensal adicional: <strong>{formatCurrency(adjustment.total_monthly_cost)}</strong>
                        <br />
                        Custo anual adicional: <strong>{formatCurrency(adjustment.total_annual_cost)}</strong>
                        <br /><br />
                        <span className="text-destructive">Esta ação não pode ser desfeita.</span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={onEffectuate} className="bg-green-600 hover:bg-green-700">
                        Confirmar Efetivação
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isReverting}
                      className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950"
                    >
                      <Undo2 className="w-4 h-4 mr-1" />
                      {isReverting ? 'Removendo...' : 'Desconsiderar'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Desconsiderar do Orçamento?</AlertDialogTitle>
                      <AlertDialogDescription>
                        O cenário "{adjustment.adjustment_name}" será removido do orçamento e voltará para o status de simulação.
                        <br /><br />
                        Você poderá aprovar outro cenário ou reaprovar este posteriormente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={onRevertToSimulation} className="bg-amber-600 hover:bg-amber-700">
                        Desconsiderar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {adjustment.status === 'effectuated' && (
              <div className="text-sm text-muted-foreground w-full text-center">
                Efetivado em {new Date(adjustment.effectuated_at!).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Conflito de Cenário */}
      <AlertDialog open={conflictDialog?.open} onOpenChange={(open) => !open && setConflictDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Cenário já aprovado para este ano
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Já existe o cenário <strong>"{conflictDialog?.existingName}"</strong> aprovado 
                para o orçamento de {adjustment.fiscal_year}.
              </p>
              <p>
                Custo anual do cenário atual: <strong>{formatCurrency(conflictDialog?.existingCost || 0)}</strong>
              </p>
              <p className="text-foreground">
                Deseja <strong>substituí-lo</strong> por "{adjustment.adjustment_name}" 
                (custo: {formatCurrency(adjustment.total_annual_cost)})?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConflictDialog(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleReplaceConfirm} className="bg-primary">
              Substituir Cenário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
