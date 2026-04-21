import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { PlanBadge } from '@/components/PlanBadge';

interface PlanGateProps {
  feature: string;
  requiredPlanLabel?: string;
  title?: string;
  description?: string;
  children: ReactNode;
}

export const PlanGate = ({
  feature,
  requiredPlanLabel = 'Pro',
  title = 'Recurso exclusivo',
  description = 'Esta funcionalidade faz parte da governança avançada de remuneração.',
  children,
}: PlanGateProps) => {
  const { hasAccess, loading } = useFeatureAccess();

  if (loading) return null;
  if (hasAccess(feature)) return <>{children}</>;

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto border-primary/30">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <CardTitle>{title}</CardTitle>
            <PlanBadge plan={requiredPlanLabel.toLowerCase() as 'pro'} />
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Faça upgrade para o plano <strong>{requiredPlanLabel}</strong> para desbloquear
            reconciliação orçamentária real, fila de aprovações com SLA e cenários comparativos
            para o ciclo de mérito.
          </p>
          <Button asChild>
            <Link to="/settings/my-plan">
              <Sparkles className="h-4 w-4 mr-2" /> Ver planos disponíveis
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
