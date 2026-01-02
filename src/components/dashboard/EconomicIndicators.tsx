import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, Wallet, HelpCircle, Percent, Building2 } from 'lucide-react';
import { useEconomicData } from '@/hooks/useEconomicData';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Currency } from '@/types/economic';
import { useState, useEffect } from 'react';
import { formatCurrencyCustom } from '@/lib/formatters';
import { toast } from 'sonner';

interface EconomicIndicatorsProps {
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  showWithCharges: boolean;
  onShowWithChargesChange: (value: boolean) => void;
}

export const EconomicIndicators = ({ 
  currency, 
  onCurrencyChange, 
  showWithCharges, 
  onShowWithChargesChange 
}: EconomicIndicatorsProps) => {
  const [inpcPeriod, setInpcPeriod] = useState<number>(12);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [localCharges, setLocalCharges] = useState<string>('');
  
  const economicData = useEconomicData(inpcPeriod);
  const { socialChargesPercentage, isLoading: loadingSettings, updateSocialCharges, isUpdating } = useCompanySettings();

  useEffect(() => {
    if (!loadingSettings) {
      setLocalCharges(socialChargesPercentage.toString());
    }
  }, [socialChargesPercentage, loadingSettings]);

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    
    await Promise.all([
      economicData.refetchUsd(),
      economicData.refetchInpc()
    ]);
    
    setTimeout(() => {
      setIsManualRefreshing(false);
      toast.success('Indicadores atualizados com sucesso!');
    }, 800);
  };

  const handleSaveCharges = () => {
    const value = parseFloat(localCharges) || 0;
    if (value < 0 || value > 200) {
      toast.error('Percentual deve estar entre 0% e 200%');
      return;
    }
    updateSocialCharges(value);
  };

  const isRefreshingAny = economicData.isLoading || economicData.isRefreshing || isManualRefreshing;
  const chargesChanged = parseFloat(localCharges) !== socialChargesPercentage;

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-background via-primary/3 to-primary/8 shadow-lg hover:shadow-primary transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-foreground">Indicadores Econômicos</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshingAny}
            className="bg-primary/10 border-primary/30 hover:bg-primary/20 hover:border-primary text-primary gap-2 shadow-sm h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingAny ? 'animate-spin' : ''}`} />
            <span className="text-xs font-medium">Atualizar</span>
          </Button>
        </div>

        {/* Indicadores principais - Grid responsivo: 1 col mobile, 2 col tablet, 4 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
          {/* USD/BRL */}
          <div className="space-y-1 p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <DollarSign className="h-4 w-4" />
              <span>USD/BRL</span>
            </div>
            {!economicData.usd && economicData.isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : economicData.usd ? (
              <div>
                <p className="text-xl font-bold">{formatCurrencyCustom(economicData.usd.value, 'BRL')}</p>
                <div className="flex items-center gap-1 text-xs">
                  {economicData.usd.percentChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={economicData.usd.percentChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {economicData.usd.percentChange > 0 ? '+' : ''}{(economicData.usd.percentChange ?? 0).toFixed(2)}%
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {economicData.usd.lastUpdate 
                    ? new Date(economicData.usd.lastUpdate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : 'N/A'}
                </p>
              </div>
            ) : (
              <p className="text-xs text-amber-600">⚠️ Indisponível</p>
            )}
          </div>

          {/* INPC */}
          <div className="space-y-1 p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <TrendingUp className="h-4 w-4" />
              <span>INPC</span>
            </div>
            {!economicData.inpc && economicData.isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : economicData.inpc ? (
              <div>
                <p className="text-xl font-bold">{(economicData.inpc.monthly ?? 0).toFixed(2)}%</p>
                <p className="text-xs text-muted-foreground">
                  Acumulado: <span className="font-semibold">{(economicData.inpc.accumulated ?? 0).toFixed(2)}%</span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {economicData.inpc.referenceMonth}
                </p>
              </div>
            ) : (
              <p className="text-xs text-amber-600">⚠️ Indisponível</p>
            )}
          </div>

          {/* Salário Mínimo */}
          <div className="space-y-1 p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Wallet className="h-4 w-4" />
              <span>Salário Mínimo</span>
            </div>
            {economicData.minimumWage ? (
              <div>
                <p className="text-xl font-bold">{formatCurrencyCustom(economicData.minimumWage.value, 'BRL')}</p>
                <p className="text-xs text-muted-foreground">
                  Vigência: {economicData.minimumWage.year}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Desde {economicData.minimumWage.effectiveDate}
                </p>
              </div>
            ) : (
              <Skeleton className="h-7 w-20" />
            )}
          </div>

          {/* Configurações */}
          <div className="space-y-2 p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <span>Configurações</span>
            </div>
            <div className="space-y-2">
              <Select value={currency} onValueChange={(value) => onCurrencyChange(value as Currency)}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">🇧🇷 BRL</SelectItem>
                  <SelectItem value="USD">🇺🇸 USD</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={inpcPeriod.toString()} onValueChange={(value) => setInpcPeriod(parseInt(value))}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">INPC 3m</SelectItem>
                  <SelectItem value="6">INPC 6m</SelectItem>
                  <SelectItem value="12">INPC 12m</SelectItem>
                  <SelectItem value="24">INPC 24m</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Seção de Encargos Sociais */}
        <div className="border-t border-border/50 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Encargos Sociais</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[280px]">
                  <p className="text-xs font-semibold mb-1">Valores típicos:</p>
                  <ul className="text-xs space-y-0.5">
                    <li>• Simples Nacional: 27-31%</li>
                    <li>• Lucro Presumido: 35-40%</li>
                    <li>• Lucro Real: 60-80%</li>
                    <li>• CLT completo: 70-100%+</li>
                  </ul>
                  <p className="text-xs mt-2 text-muted-foreground">
                    Inclui INSS, FGTS, 13º, férias, etc.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Input de percentual */}
            <div className="flex items-center gap-2">
              <Label htmlFor="charges" className="text-xs text-muted-foreground whitespace-nowrap">
                Percentual:
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  id="charges"
                  type="number"
                  min="0"
                  max="200"
                  step="0.5"
                  value={localCharges}
                  onChange={(e) => setLocalCharges(e.target.value)}
                  className="w-20 h-8 text-sm"
                  disabled={loadingSettings}
                />
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
              {chargesChanged && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveCharges}
                  disabled={isUpdating}
                  className="h-8 text-xs"
                >
                  {isUpdating ? 'Salvando...' : 'Salvar'}
                </Button>
              )}
            </div>

            {/* Toggle Com/Sem Encargos */}
            <div className="flex items-center gap-2 ml-auto">
              <Label htmlFor="with-charges" className="text-xs text-muted-foreground">
                Sem encargos
              </Label>
              <Switch
                id="with-charges"
                checked={showWithCharges}
                onCheckedChange={onShowWithChargesChange}
                disabled={socialChargesPercentage === 0}
              />
              <Label htmlFor="with-charges" className="text-xs font-medium">
                Com encargos
              </Label>
              {showWithCharges && socialChargesPercentage > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  +{socialChargesPercentage}%
                </span>
              )}
            </div>
          </div>
          
          {socialChargesPercentage === 0 && (
            <p className="text-[10px] text-muted-foreground mt-2">
              Configure o percentual de encargos para visualizar valores com encargos
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};