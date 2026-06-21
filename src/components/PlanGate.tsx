import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { PlanBadge } from '@/components/PlanBadge';
import { cn } from '@/lib/utils';

const SALES_EMAIL = 'contato@compsmart.ia.br';

interface PlanGateProps {
  feature: string;
  /** "page" (default) replaces the children with a full upgrade screen.
   *  "card" keeps the children rendered with a blur + lock overlay (for mini cards). */
  mode?: 'page' | 'card';
  /** Human-readable name of the feature (used in the contact email subject). */
  featureName?: string;
  requiredPlanLabel?: string;
  title?: string;
  description?: string;
  /** Card mode only — blur amount in px. Default 6. */
  blurAmount?: number;
  /** Card mode only — opacity of the locked content. Default 0.6. */
  lockOpacity?: number;
  children: ReactNode;
}

export const PlanGate = ({
  feature,
  mode = 'page',
  featureName,
  requiredPlanLabel = 'Pro',
  title = 'Recurso exclusivo',
  description = 'Esta funcionalidade faz parte da governança avançada de remuneração.',
  blurAmount = 6,
  lockOpacity = 0.6,
  children,
}: PlanGateProps) => {
  const { hasAccess, loading } = useFeatureAccess();

  if (loading) return null;
  if (hasAccess(feature)) return <>{children}</>;

  const resolvedName = featureName ?? title;
  const mailtoHref = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(
    `Interesse no recurso ${resolvedName}`
  )}&body=${encodeURIComponent(
    `Olá, tenho interesse em ativar o recurso "${resolvedName}" na minha conta CompSmart. Por favor, entrem em contato.`
  )}`;

  // === CARD MODE: blur + overlay on top of the existing children ===
  if (mode === 'card') {
    return (
      <div className="relative isolate">
        <div
          aria-hidden="true"
          className="pointer-events-none select-none"
          style={{ filter: `blur(${blurAmount}px)`, opacity: lockOpacity }}
        >
          {children}
        </div>
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-background/70 backdrop-blur-sm p-4 text-center">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold flex items-center justify-center gap-2">
              {resolvedName}
              <PlanBadge plan={requiredPlanLabel.toLowerCase() as 'pro'} />
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Disponível no plano <strong>{requiredPlanLabel}</strong>.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild size="sm">
              <Link to="/settings/my-plan">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Fazer upgrade
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href={mailtoHref}>
                <Mail className="h-3.5 w-3.5 mr-1.5" /> Falar com vendas
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // === PAGE MODE (default): full-screen upgrade card ===
  return (
    <div className="container mx-auto p-6">
      <Card className={cn('max-w-2xl mx-auto border-primary/30')}>
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
            este recurso, ou fale com nosso time comercial.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild>
              <Link to="/settings/my-plan">
                <Sparkles className="h-4 w-4 mr-2" /> Fazer upgrade
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href={mailtoHref}>
                <Mail className="h-4 w-4 mr-2" /> Falar com vendas
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
