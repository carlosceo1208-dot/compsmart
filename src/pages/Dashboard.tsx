import { EconomicIndicators } from "@/components/dashboard/EconomicIndicators";
import { KPIDashboard } from "@/components/dashboard/KPIDashboard";
import { AlphabeticalNav } from "@/components/dashboard/AlphabeticalNav";
import { ModuleGrid } from "@/components/dashboard/ModuleGrid";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";

const Dashboard = () => {
  const { currency, setCurrency } = useCurrencyConverter();

  return (
    <div className="h-[calc(100vh-8rem)] overflow-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 p-6">
        {/* Coluna Esquerda: KPIs */}
        <div className="space-y-4">
          <div className="rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 border border-primary/20">
            <h1 className="text-2xl font-bold mb-1">CompSmart</h1>
            <p className="text-sm text-muted-foreground">
              Dashboard Executivo
            </p>
          </div>
          
          <KPIDashboard currency={currency} />
        </div>
        
        {/* Coluna Direita: Indicadores + Navegação + Módulos */}
        <div className="space-y-4">
          <EconomicIndicators 
            currency={currency} 
            onCurrencyChange={setCurrency}
          />
          
          <AlphabeticalNav />
          
          <ModuleGrid maxVisible={9} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
