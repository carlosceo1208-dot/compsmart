import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, Calendar, DollarSign } from "lucide-react";
import { useCollectiveAdjustments, CollectiveAdjustment } from "@/hooks/useCollectiveAdjustments";
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
} from "@/components/ui/alert-dialog";

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export function PendingAdjustmentAlert() {
  const navigate = useNavigate();
  const { pendingAdjustments, effectuateSalaries, isPendingLoading } = useCollectiveAdjustments();
  const [selectedAdjustment, setSelectedAdjustment] = useState<CollectiveAdjustment | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  if (isPendingLoading || pendingAdjustments.length === 0) {
    return null;
  }

  const handleEffectuate = async () => {
    if (!selectedAdjustment) return;
    
    try {
      await effectuateSalaries.mutateAsync(selectedAdjustment);
      setShowConfirmDialog(false);
      setSelectedAdjustment(null);
    } catch (error) {
      console.error('Error effectuating:', error);
    }
  };

  return (
    <>
      <Alert className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-300 flex items-center gap-2">
          Ajuste Salarial Pendente
          <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700">
            {pendingAdjustments.length} pendente{pendingAdjustments.length > 1 ? 's' : ''}
          </Badge>
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          {pendingAdjustments.slice(0, 2).map((adj) => (
            <div
              key={adj.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-white dark:bg-background border"
            >
              <div className="space-y-1">
                <p className="font-medium text-foreground">{adj.adjustment_name}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {MONTH_NAMES[adj.effective_month - 1]}/{adj.fiscal_year}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    +{formatCurrency(adj.total_monthly_cost)}/mês
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setSelectedAdjustment(adj);
                    setShowConfirmDialog(true);
                  }}
                >
                  Efetivar Salários
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/salary-analysis-report')}
                >
                  Ver Detalhes
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          ))}

          {pendingAdjustments.length > 2 && (
            <Button
              variant="link"
              size="sm"
              className="text-amber-700 dark:text-amber-300 p-0 h-auto"
              onClick={() => navigate('/salary-analysis-report')}
            >
              Ver todos os {pendingAdjustments.length} ajustes pendentes →
            </Button>
          )}
        </AlertDescription>
      </Alert>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Efetivar Ajuste Salarial?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAdjustment && (
                <>
                  Você está prestes a efetivar o ajuste <strong>"{selectedAdjustment.adjustment_name}"</strong>.
                  <br /><br />
                  • <strong>{selectedAdjustment.total_employees_affected}</strong> funcionários serão impactados
                  <br />
                  • Custo mensal adicional: <strong>{formatCurrency(selectedAdjustment.total_monthly_cost)}</strong>
                  <br />
                  • Custo anual adicional: <strong>{formatCurrency(selectedAdjustment.total_annual_cost)}</strong>
                  <br /><br />
                  <span className="text-destructive font-medium">
                    Os salários serão atualizados permanentemente. Esta ação não pode ser desfeita.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Adiar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEffectuate}
              className="bg-green-600 hover:bg-green-700"
              disabled={effectuateSalaries.isPending}
            >
              {effectuateSalaries.isPending ? 'Efetivando...' : 'Confirmar Efetivação'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
