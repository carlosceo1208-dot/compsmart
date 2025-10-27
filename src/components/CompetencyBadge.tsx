import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface CompetencyBadgeProps {
  name: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  type: 'hard_skill' | 'soft_skill';
  isRequired?: boolean;
}

const levelConfig = {
  basic: { stars: 1, label: 'Básico', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  intermediate: { stars: 2, label: 'Intermediário', color: 'bg-green-100 text-green-700 border-green-300' },
  advanced: { stars: 3, label: 'Avançado', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  expert: { stars: 4, label: 'Expert', color: 'bg-purple-100 text-purple-700 border-purple-300' }
};

export const CompetencyBadge = ({ name, level, type, isRequired = true }: CompetencyBadgeProps) => {
  const config = levelConfig[level];

  return (
    <Badge variant="outline" className={`${config.color} flex items-center gap-2 py-1.5 px-3`}>
      <span className="font-medium">{name}</span>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: config.stars }).map((_, i) => (
          <Star key={i} className="w-3 h-3 fill-current" />
        ))}
      </div>
      {!isRequired && (
        <span className="text-xs opacity-70">(Opcional)</span>
      )}
    </Badge>
  );
};
