import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useEconomicData } from '@/hooks/useEconomicData';
import { Currency } from '@/types/economic';
import { useState } from 'react';
import { formatCurrencyCustom } from '@/lib/formatters';
import { toast } from 'sonner';

interface EconomicIndicatorsProps {
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

export const EconomicIndicators = ({ currency, onCurrencyChange }: EconomicIndicatorsProps) => {
  const [inpcPeriod, setInpcPeriod] = useState<number>(12);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const economicData = useEconomicData(inpcPeriod);

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    
    await Promise.all([
      economicData.refetchUsd(),
      economicData.refetchInpc()
    ]);
    
    // Garantir tempo mínimo de feedback visual (800ms)
    setTimeout(() => {
      setIsManualRefreshing(false);
      toast.success('Dados atualizados com sucesso!');
    }, 800);
  };

  const isRefreshingAny = economicData.isLoading || economicData.isRefreshing || isManualRefreshing;

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-background via-primary/3 to-primary/8 shadow-lg hover:shadow-primary transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-foreground">Indicadores Econômicos</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshingAny}
            className="bg-primary/10 border-primary/30 hover:bg-primary/20 hover:border-primary text-primary gap-2 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshingAny ? 'animate-spin' : ''}`} />
            <span className="text-xs font-medium">Atualizar</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-x divide-primary/20">
          {/* USD/BRL */}
          <div className="space-y-2 px-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <DollarSign className="h-5 w-5" />
              <span>Dólar (USD/BRL)</span>
            </div>
            {!economicData.usd && economicData.isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : economicData.usd ? (
              <div className="relative">
                <p className="text-2xl font-bold">{formatCurrencyCustom(economicData.usd.value, 'BRL')}</p>
                <div className="flex items-center gap-1 text-sm">
                  {economicData.usd.percentChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={economicData.usd.percentChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {economicData.usd.percentChange > 0 ? '+' : ''}{(economicData.usd.percentChange ?? 0).toFixed(2)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Atualizado: {economicData.usd.lastUpdate?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || 'N/A'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-amber-600">⚠️ Cotação indisponível</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="text-xs h-7"
                >
                  Recarregar
                </Button>
              </div>
            )}
          </div>

          {/* INPC */}
          <div className="space-y-2 px-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <TrendingUp className="h-5 w-5" />
              <span>INPC</span>
            </div>
            {!economicData.inpc && economicData.isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : economicData.inpc ? (
              <>
                <p className="text-2xl font-bold">{(economicData.inpc.monthly ?? 0).toFixed(2)}%</p>
                <p className="text-sm text-muted-foreground">
                  Acumulado ({inpcPeriod}m): <span className="font-semibold">{(economicData.inpc.accumulated ?? 0).toFixed(2)}%</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {economicData.inpc.referenceMonth}
                </p>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-amber-600">⚠️ Dados indisponíveis</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="text-xs h-7"
                >
                  Recarregar
                </Button>
              </div>
            )}
          </div>

          {/* Seletor de Moeda */}
          <div className="space-y-2 px-4">
            <label className="text-sm font-semibold text-primary">Moeda de Exibição</label>
            <Select value={currency} onValueChange={(value) => onCurrencyChange(value as Currency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">🇧🇷 Real (BRL)</SelectItem>
                <SelectItem value="USD">🇺🇸 Dólar (USD)</SelectItem>
              </SelectContent>
            </Select>
            
            <label className="text-sm font-semibold text-primary mt-2 block">Período INPC</label>
            <Select value={inpcPeriod.toString()} onValueChange={(value) => setInpcPeriod(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 meses</SelectItem>
                <SelectItem value="6">6 meses</SelectItem>
                <SelectItem value="12">12 meses</SelectItem>
                <SelectItem value="24">24 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
