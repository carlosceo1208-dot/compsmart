import { Badge } from '@/components/ui/badge';
import { PlanType } from '@/hooks/useFeatureAccess';

interface PlanBadgeProps {
  plan: PlanType;
}

export const PlanBadge = ({ plan }: PlanBadgeProps) => {
  const config = {
    starter: {
      label: 'STARTER',
      className: 'bg-secondary text-secondary-foreground',
    },
    medium: {
      label: 'MEDIUM',
      className: 'bg-primary/20 text-primary border-primary/30',
    },
    pro: {
      label: 'PRO',
      className: 'bg-gradient-to-r from-accent via-primary to-accent text-white border-0 shadow-md',
    },
  };

  const { label, className } = config[plan];

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
};
