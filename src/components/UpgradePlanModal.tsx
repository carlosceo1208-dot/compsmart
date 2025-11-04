import { useNavigate } from 'react-router-dom';
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
import { PlanType } from '@/hooks/useFeatureAccess';
import { Sparkles } from 'lucide-react';

interface UpgradePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  requiredPlan: PlanType;
}

export const UpgradePlanModal = ({
  open,
  onOpenChange,
  feature,
  requiredPlan,
}: UpgradePlanModalProps) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/pricing');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <AlertDialogTitle>Recurso Premium</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            O recurso <strong>{feature}</strong> está disponível apenas no plano{' '}
            <strong className="text-primary">{requiredPlan.toUpperCase()}</strong>.
          </AlertDialogDescription>
          <AlertDialogDescription className="text-sm text-muted-foreground mt-2">
            Faça upgrade agora e desbloqueie todos os recursos avançados do CompSmart.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpgrade}>
            Ver Planos
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
