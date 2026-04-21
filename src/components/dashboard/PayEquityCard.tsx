import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scale, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePayEquityAlerts } from '@/hooks/usePayEquity';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';

export const PayEquityCard = () => {
  const navigate = useNavigate();
  const { data: role } = useCurrentUserRole();
  const { data: alerts = [] } = usePayEquityAlerts();

  if (!(role?.isAdmin || role?.isSuperAdmin || role?.isHR)) return null;

  const open = alerts.filter((a) => a.status === 'open').length;
  const critical = alerts.filter((a) => a.severity === 'critical' && a.status === 'open').length;

  return (
    <Card className="border-primary/20 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          Pay Equity & Fairness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted p-2 text-center">
            <div className="text-xs text-muted-foreground">Abertos</div>
            <div className="text-lg font-bold">{open}</div>
          </div>
          <div className="rounded-lg bg-destructive/10 p-2 text-center">
            <div className="text-xs text-muted-foreground">Críticos</div>
            <div className="text-lg font-bold text-destructive">{critical}</div>
          </div>
        </div>
        {critical > 0 && (
          <Badge variant="destructive" className="w-full justify-center">
            Ação imediata recomendada
          </Badge>
        )}
        <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/pay-equity')}>
          Abrir <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
};
