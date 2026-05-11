import { useState } from "react";
import { EconomicIndicators } from "@/components/dashboard/EconomicIndicators";
import { KPIDashboard } from "@/components/dashboard/KPIDashboard";
import { AlphabeticalNav } from "@/components/dashboard/AlphabeticalNav";
import { ModuleGrid } from "@/components/dashboard/ModuleGrid";
import { DateTimeDisplay } from "@/components/dashboard/DateTimeDisplay";
import { ExportCard } from "@/components/dashboard/ExportCard";
import { OrganizationalIdentityCard } from "@/components/dashboard/OrganizationalIdentityCard";
import { PendingAdjustmentAlert } from "@/components/dashboard/PendingAdjustmentAlert";
import { SalaryTableSetupAlert } from "@/components/dashboard/SalaryTableSetupAlert";
import { DashboardTour } from "@/components/dashboard/DashboardTour";
import { CompanyMapCard } from "@/components/dashboard/CompanyMapCard";
import { CompensationTrendsCard } from "@/components/dashboard/CompensationTrendsCard";
import { MeritCoherenceCard } from "@/components/dashboard/MeritCoherenceCard";
import { TalentIntelligenceCard } from "@/components/dashboard/TalentIntelligenceCard";
import { PayEquityCard } from "@/components/dashboard/PayEquityCard";
import { ExecutiveCompCard } from "@/components/dashboard/ExecutiveCompCard";
import { EconomicIndicatorsCard } from "@/components/dashboard/EconomicIndicatorsCard";
import { SecurityQuickAccessCard } from "@/components/dashboard/SecurityQuickAccessCard";
import { PerformanceModuleCard } from "@/components/dashboard/PerformanceModuleCard";
import { BemEstarModuleCard } from "@/components/dashboard/BemEstarModuleCard";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { useFounderStatus } from "@/hooks/useFounderStatus";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { FounderBadge } from "@/components/launch/FounderBadge";

const Dashboard = () => {
  const { currency, setCurrency } = useCurrencyConverter();
  const [showWithCharges, setShowWithCharges] = useState(false);
  const { data: isFounder } = useFounderStatus();
  const { data: userRole } = useCurrentUserRole();

  const isSuperAdmin = userRole?.isSuperAdmin || false;

  return (
    <div className="h-[calc(100vh-8rem)] overflow-auto">
      <DashboardTour />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[350px_1fr] gap-4 md:gap-5 lg:gap-6 p-4 md:p-5 lg:p-6">
        {/* Coluna Esquerda: KPIs */}
        <div className="space-y-4">
          <div className="dashboard-welcome rounded-xl bg-gradient-to-br from-primary via-primary-hover to-secondary/30 p-4 md:p-6 lg:p-8 border-2 border-primary/30 shadow-primary">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 text-white">CompSmart</h1>
                  {isFounder && <FounderBadge className="mb-2" />}
                </div>
                <p className="text-xs sm:text-sm text-white/90 font-medium">
                  Dashboard Executivo
                </p>
              </div>
              <div className="flex-shrink-0">
                <DateTimeDisplay />
              </div>
            </div>
          </div>
          
          {/* Warning de Ajuste Pendente */}
          <PendingAdjustmentAlert />
          
          {/* Alerta Educativo - Tabela Salarial */}
          <SalaryTableSetupAlert />
          
          {/* Card de Segurança - Apenas Super Admin */}
          {isSuperAdmin && <SecurityQuickAccessCard />}
          
          {/* Cards de Módulos em destaque */}
          <div className="grid gap-4 md:grid-cols-2">
            <PerformanceModuleCard />
            <BemEstarModuleCard />
          </div>
          
          {/* Mapa de Localização das Unidades */}
          <CompanyMapCard />
          
          <OrganizationalIdentityCard />
          
          <KPIDashboard currency={currency} showWithCharges={showWithCharges} />
          
          <ExportCard />
        </div>
        
        {/* Coluna Direita: Indicadores + Navegação + Módulos */}
        <div className="space-y-4">
          <EconomicIndicators 
            currency={currency} 
            onCurrencyChange={setCurrency}
            showWithCharges={showWithCharges}
            onShowWithChargesChange={setShowWithCharges}
          />
          
          <CompensationTrendsCard />
          
          <MeritCoherenceCard />
          
          <TalentIntelligenceCard />
          
          <PayEquityCard />
          
          <ExecutiveCompCard />
          
          <EconomicIndicatorsCard />
          
          <AlphabeticalNav />
          
          <ModuleGrid />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;