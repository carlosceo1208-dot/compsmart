import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTalentKPIs } from '@/hooks/useTalentIntelligence';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(v);

export const TalentIntelligenceCard = () => {
  const navigate = useNavigate();
  const { data: role } = useCurrentUserRole();
  const { data: kpis, isLoading } = useTalentKPIs();

  if (!(role?.isAdmin || role?.isSuperAdmin || role?.isHR)) return null;

  return (
    <Card className="border-primary/20 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Talent Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-emerald-500/10 p-2 text-center">
                <div className="text-xs text-muted-foreground">Stars</div>
                <div className="text-lg font-bold text-emerald-600">{kpis?.stars ?? 0}</div>
              </div>
              <div className="rounded-lg bg-red-500/10 p-2 text-center">
                <div className="text-xs text-muted-foreground">Action</div>
                <div className="text-lg font-bold text-red-600">{kpis?.action ?? 0}</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Impacto anual</span>
              <span className="font-semibold">{formatBRL(kpis?.totalImpact ?? 0)}</span>
            </div>
            {kpis?.pending ? (
              <Badge variant="secondary" className="w-full justify-center">
                {kpis.pending} recomendações pendentes
              </Badge>
            ) : null}
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/talent-intelligence')}>
              Abrir <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
