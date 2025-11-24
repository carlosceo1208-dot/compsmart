import { EconomicIndicators } from "@/components/dashboard/EconomicIndicators";
import { KPIDashboard } from "@/components/dashboard/KPIDashboard";
import { AlphabeticalNav } from "@/components/dashboard/AlphabeticalNav";
import { ModuleGrid } from "@/components/dashboard/ModuleGrid";
import { DateTimeDisplay } from "@/components/dashboard/DateTimeDisplay";
import { ExportCard } from "@/components/dashboard/ExportCard";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import compsmartLogo from "@/assets/compsmart-logo.png";

const Dashboard = () => {
  const { currency, setCurrency } = useCurrencyConverter();

  return (
    <div className="h-[calc(100vh-8rem)] overflow-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-4 sm:gap-6 p-4 sm:p-6">
        {/* Coluna Esquerda: KPIs */}
        <div className="space-y-4">
          <div className="rounded-xl bg-gradient-to-br from-primary via-primary-hover to-secondary/30 p-6 md:p-8 border-2 border-primary/30 shadow-primary">
            <div className="flex items-center justify-between gap-4">
              {/* Logo + Título */}
              <div className="flex items-center gap-3 md:gap-4">
                <img 
                  src={compsmartLogo} 
                  alt="CompSmart Logo" 
                  className="w-12 h-12 md:w-16 md:h-16 object-contain"
                />
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">CompSmart</h1>
                  <p className="text-xs sm:text-sm text-white/90 font-medium">
                    Dashboard Executivo
                  </p>
                </div>
              </div>
              
              {/* Data/Hora - sempre à direita */}
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
