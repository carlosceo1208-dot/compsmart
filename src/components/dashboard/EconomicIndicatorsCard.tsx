import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEconomicIndicators, useRefreshIndicators } from '@/hooks/useEconomicIndicators';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const EconomicIndicatorsCard = () => {
  const { data: indicators, isLoading } = useEconomicIndicators();
  const refresh = useRefreshIndicators();

  const usd = indicators?.['USD_BRL'];
  const inpcMonth = indicators?.['INPC_MONTH'];
  const inpc12m = indicators?.['INPC_12M'];

  const usdChange = usd?.metadata?.pctChange ? Number(usd.metadata.pctChange) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Indicadores Macro
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refresh.mutate()}
          disabled={refresh.isPending}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refresh.isPending ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" /> USD/BRL
            </div>
            <div className="text-xl font-bold">
              {usd ? `R$ ${Number(usd.indicator_value).toFixed(4)}` : '—'}
            </div>
            {usd && (
              <Badge
                variant={usdChange >= 0 ? 'default' : 'secondary'}
                className="text-[10px] px-1.5 py-0"
              >
                {usdChange >= 0 ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
                {usdChange.toFixed(2)}%
              </Badge>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">INPC mês</div>
            <div className="text-xl font-bold">
              {inpcMonth ? `${Number(inpcMonth.indicator_value).toFixed(2)}%` : '—'}
            </div>
            {inpcMonth?.metadata?.reference_period && (
              <div className="text-[10px] text-muted-foreground">
                {inpcMonth.metadata.reference_period}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">INPC 12m</div>
            <div className="text-xl font-bold">
              {inpc12m ? `${Number(inpc12m.indicator_value).toFixed(2)}%` : '—'}
            </div>
            <div className="text-[10px] text-muted-foreground">acumulado</div>
          </div>
        </div>

        {usd?.fetched_at && (
          <div className="text-[10px] text-muted-foreground pt-1 border-t">
            Atualizado {formatDistanceToNow(new Date(usd.fetched_at), { locale: ptBR, addSuffix: true })}
          </div>
        )}

        {!isLoading && !usd && (
          <div className="text-xs text-muted-foreground text-center py-2">
            Clique em atualizar para buscar dados.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
