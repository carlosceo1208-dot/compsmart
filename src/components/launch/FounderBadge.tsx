import { Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FounderBadgeProps {
  className?: string;
}

export const FounderBadge = ({ className = '' }: FounderBadgeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/50 cursor-default ${className}`}
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
            <span className="text-sm font-semibold bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent">
              Fundador
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm">
            <strong>Membro Fundador</strong>
            <br />
            Você fez parte do lançamento oficial do CompSmart em 07/02/2026!
            Este selo exclusivo reconhece sua confiança desde o início.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
