import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLtipSimulations } from '@/hooks/useExecutiveCompensation';
import { AiBadge } from '@/components/ui/ai-badge';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(v);

export const ExecutiveCompCard = () => {
  const navigate = useNavigate();
  const { data: role } = useCurrentUserRole();
  const { data: sims = [] } = useLtipSimulations();

  if (!(role?.isAdmin || role?.isSuperAdmin)) return null;

  const totalProjected = sims.reduce((s, x) => s + Number(x.total_value_at_vest ?? 0), 0);

  return (
    <Card className="border-primary/20 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          Executive Compensation
          <AiBadge variant="subtle" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted p-2 text-center">
            <div className="text-xs text-muted-foreground">Cenários</div>
            <div className="text-lg font-bold">{sims.length}</div>
          </div>
          <div className="rounded-lg bg-primary/10 p-2 text-center">
            <div className="text-xs text-muted-foreground">Vest projetado</div>
            <div className="text-lg font-bold text-primary">{formatBRL(totalProjected)}</div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/executive-compensation')}>
          Simular ILP <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
};
