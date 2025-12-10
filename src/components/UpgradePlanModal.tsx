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
import { Badge } from '@/components/ui/badge';
import { PlanType, useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Sparkles, Check, X, Crown, Rocket, TrendingUp, Building2 } from 'lucide-react';

interface UpgradePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  requiredPlan: PlanType;
}

const planConfig: Record<PlanType, { 
  name: string; 
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  features: string[];
}> = {
  starter: {
    name: 'Starter',
    icon: Rocket,
    color: 'text-green-600',
    features: [
      'Até 50 funcionários',
      'Gestão básica de cargos',
      'Tabelas salariais',
      'People Analytics básico',
      'Pesquisa Salarial',
    ],
  },
  medium: {
    name: 'Growth',
    icon: TrendingUp,
    color: 'text-violet-600',
    features: [
      'Até 250 funcionários',
      'Comparação salarial',
      'Alertas automáticos',
      'Auditoria de acesso',
      'Base de conhecimento',
      'Planejamento de orçamento',
    ],
  },
  pro: {
    name: 'Business',
    icon: Building2,
    color: 'text-blue-600',
    features: [
      'Até 500 funcionários',
      'Assistentes IA (Jurídico, Salarial, R&B)',
      'Programas de incentivos',
      'Análise salarial avançada',
      'Relatórios personalizados',
      'Suporte prioritário',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    icon: Crown,
    color: 'text-amber-600',
    features: [
      'Funcionários ilimitados',
      'Todas as funcionalidades',
      'API de integração',
      'SSO / SAML',
      'Integrações customizadas',
      'Gerente de conta dedicado',
    ],
  },
};

const planHierarchy: PlanType[] = ['starter', 'medium', 'pro', 'enterprise'];

export const UpgradePlanModal = ({
  open,
  onOpenChange,
  feature,
  requiredPlan,
}: UpgradePlanModalProps) => {
  const navigate = useNavigate();
  const { plan: currentPlan, status, daysLeftInTrial } = useFeatureAccess();
  
  const requiredConfig = planConfig[requiredPlan];
  const currentConfig = planConfig[currentPlan];
  const RequiredIcon = requiredConfig.icon;

  const handleUpgrade = () => {
    // For enterprise, redirect to contact
    if (requiredPlan === 'enterprise') {
      window.location.href = 'mailto:comercial@compsmart.com.br?subject=Interesse no Plano Enterprise';
    } else {
      // Find the plan ID from subscription_plans and redirect to checkout
      navigate('/pricing');
    }
    onOpenChange(false);
  };

  const currentPlanIndex = planHierarchy.indexOf(currentPlan);
  const requiredPlanIndex = planHierarchy.indexOf(requiredPlan);
  const plansToShow = planHierarchy.slice(currentPlanIndex, requiredPlanIndex + 1);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20`}>
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <AlertDialogTitle className="text-xl">Recurso Premium</AlertDialogTitle>
          </div>
          
          <AlertDialogDescription className="text-base space-y-4">
            <p>
              O recurso <strong className="text-foreground">{feature}</strong> está disponível 
              a partir do plano{' '}
              <Badge variant="outline" className={`${requiredConfig.color} border-current`}>
                <RequiredIcon className="w-3 h-3 mr-1" />
                {requiredConfig.name}
              </Badge>
            </p>

            {status === 'trial' && daysLeftInTrial && daysLeftInTrial > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  ⏰ Seu trial termina em <strong>{daysLeftInTrial} dias</strong>. 
                  Faça upgrade agora para não perder acesso às funcionalidades premium.
                </p>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-foreground">
                O que você ganha com o {requiredConfig.name}:
              </p>
              <ul className="space-y-2">
                {requiredConfig.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 ${requiredConfig.color}`} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {currentPlan !== 'starter' && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  Seu plano atual: <span className={currentConfig.color}>{currentConfig.name}</span>
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleUpgrade}
            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
          >
            {requiredPlan === 'enterprise' ? 'Falar com Comercial' : 'Ver Planos'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
