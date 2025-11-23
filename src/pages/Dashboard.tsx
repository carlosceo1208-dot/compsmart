import { EconomicIndicators } from "@/components/dashboard/EconomicIndicators";
import { KPIDashboard } from "@/components/dashboard/KPIDashboard";
import { AlphabeticalNav } from "@/components/dashboard/AlphabeticalNav";
import { ModuleGrid } from "@/components/dashboard/ModuleGrid";
import { DateTimeDisplay } from "@/components/dashboard/DateTimeDisplay";
import { ExportCard } from "@/components/dashboard/ExportCard";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";

const Dashboard = () => {
  const { currency, setCurrency } = useCurrencyConverter();

  return (
    <div className="h-[calc(100vh-8rem)] overflow-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 p-6">
        {/* Coluna Esquerda: KPIs */}
        <div className="space-y-4">
          <div className="rounded-xl bg-gradient-to-br from-primary via-primary-hover to-primary-dark p-8 border-2 border-primary/30 shadow-primary">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-white">CompSmart</h1>
                <p className="text-sm text-white/90 font-medium">
                  Dashboard Executivo
                </p>
              </div>
              <DateTimeDisplay />
            </div>
          </div>
          
          <KPIDashboard currency={currency} />
          
          <ExportCard />
        </div>
        
        {/* Coluna Direita: Indicadores + Navegação + Módulos */}
        <div className="space-y-4">
          <EconomicIndicators 
            currency={currency} 
            onCurrencyChange={setCurrency}
          />
          
          <AlphabeticalNav />
          
          <ModuleGrid />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
