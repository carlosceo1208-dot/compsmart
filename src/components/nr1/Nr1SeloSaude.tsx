import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { notaSaude, seloSaude } from '@/lib/nr1Selo';
import { cn } from '@/lib/utils';

export const TEXTO_CONVERSAO = 'Nota de saúde = 100 − risco psicossocial';

/** Selo único do NR-1 a partir do score de risco do COPSOQ (A1/A9). */
export function Nr1SeloSaude({ risco, className, mostrarNota = true }: { risco: number | null | undefined; className?: string; mostrarNota?: boolean }) {
  const saude = notaSaude(risco);
  const selo = seloSaude(saude);
  if (!selo || saude == null) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={selo.variant} className={cn('cursor-help', className)}>
          {selo.label}{mostrarNota ? ` · saúde ${saude.toFixed(1).replace('.', ',')}` : ''}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{TEXTO_CONVERSAO}. Selo: ≥70 Saudável, 55–69 Atenção, &lt;55 Crítico.</TooltipContent>
    </Tooltip>
  );
}

export function Nr1SeloRodape({ className }: { className?: string }) {
  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      {TEXTO_CONVERSAO} (COPSOQ-III). Selo: ≥70 Saudável, 55–69 Atenção, abaixo de 55 Crítico. Ciclos com menos de 5 respostas ficam sem nota.
    </p>
  );
}
