import { ReactNode } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useModuleAccess, type ModuleSlug } from '@/hooks/useModuleAccess';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ModuleGateProps {
  moduleSlug?: ModuleSlug;
  moduleSlugs?: ModuleSlug[];
  requireAll?: boolean;
  allowIf?: boolean;
  featureName?: string;
  description?: string;
  ctaLabel?: string;
  mode?: 'card' | 'page' | 'section' | 'inline';
  className?: string;
  children?: ReactNode;
}

const joinNames = (names: string[], connector: 'ou' | 'e') => {
  if (names.length <= 1) return names[0] ?? 'módulo';
  if (names.length === 2) return `${names[0]} ${connector} ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} ${connector} ${names[names.length - 1]}`;
};

export const ModuleGate = ({
  moduleSlug,
  moduleSlugs,
  requireAll = false,
  allowIf = false,
  featureName,
  description,
  ctaLabel,
  mode = 'card',
  className,
  children,
}: ModuleGateProps) => {
  const access = useModuleAccess();
  const requiredSlugs = moduleSlugs ?? (moduleSlug ? [moduleSlug] : []);
  const moduleNames = requiredSlugs.map((slug) => access.getModuleName(slug));
  const moduleLabel = joinNames(moduleNames, requireAll ? 'e' : 'ou');
  const isAllowedByModules = requireAll
    ? access.hasAllModules(requiredSlugs)
    : access.hasAnyModule(requiredSlugs);
  const isAllowed = allowIf || requiredSlugs.length === 0 || isAllowedByModules;
  const lockedTitle = featureName ?? moduleLabel;
  const actionLabel = ctaLabel ?? (requiredSlugs.length > 1 ? `Ativar ${moduleLabel}` : `Ativar módulo ${moduleLabel}`);

  const handleActivate = () => {
    toast.info(actionLabel, {
      description: 'Entre em contato com a CompSmart para liberar este módulo para a sua empresa.',
    });
  };

  if (access.loading) {
    return <Skeleton className={cn(mode === 'inline' ? 'h-5 w-24' : mode === 'page' ? 'h-64 w-full' : 'h-36 w-full', className)} />;
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  if (mode === 'inline') {
    return (
      <Button type="button" variant="outline" size="sm" onClick={handleActivate} className={cn('h-7 gap-1 text-xs', className)}>
        <Lock className="h-3.5 w-3.5" />
        Bloqueado
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        'border-2 border-dashed border-border/80 bg-card/80 shadow-sm',
        mode === 'page' && 'min-h-[55vh] flex items-center justify-center',
        className,
      )}
    >
      <CardContent className={cn('p-6', mode === 'page' && 'max-w-xl text-center')}> 
        <div className={cn('flex gap-4', mode === 'page' ? 'flex-col items-center' : 'items-start')}>
          <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className={cn('min-w-0 space-y-3', mode === 'page' && 'flex flex-col items-center')}>
            <div>
              <p className="text-sm font-semibold text-foreground">{lockedTitle}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {description ?? `Disponível para empresas com ${moduleLabel} contratado.`}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleActivate} className="w-fit">
              <Sparkles className="h-4 w-4" />
              {actionLabel}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};