import { useState } from "react";
import { motion } from "framer-motion";
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
import { MarketInsightsCard } from "@/components/dashboard/MarketInsightsCard";
import { MeritCoherenceCard } from "@/components/dashboard/MeritCoherenceCard";
import { TalentIntelligenceCard } from "@/components/dashboard/TalentIntelligenceCard";
import { PayEquityCard } from "@/components/dashboard/PayEquityCard";
import { ExecutiveCompCard } from "@/components/dashboard/ExecutiveCompCard";
import { EconomicIndicatorsCard } from "@/components/dashboard/EconomicIndicatorsCard";
import { PerformanceModuleCard } from "@/components/dashboard/PerformanceModuleCard";
import { BemEstarModuleCard } from "@/components/dashboard/BemEstarModuleCard";
import { RecrutamentoModuleCard } from "@/components/dashboard/RecrutamentoModuleCard";
import { ModuleGate } from "@/components/ModuleGate";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { useFounderStatus } from "@/hooks/useFounderStatus";
import { FounderBadge } from "@/components/launch/FounderBadge";
import { AiBadge } from "@/components/ui/ai-badge";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const Item = ({ i, children }: { i: number; children: React.ReactNode }) => (
  <motion.div custom={i} initial="hidden" animate="show" variants={fadeUp}>
    {children}
  </motion.div>
);

const Dashboard = () => {
  const { currency, setCurrency } = useCurrencyConverter();
  const [showWithCharges, setShowWithCharges] = useState(false);
  const { data: isFounder } = useFounderStatus();

  return (
    <div className="h-[calc(100vh-8rem)] overflow-auto">
      <DashboardTour />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[350px_1fr] gap-4 md:gap-5 lg:gap-6 p-4 md:p-5 lg:p-6">
        {/* Coluna Esquerda: KPIs */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="dashboard-welcome rounded-xl bg-gradient-to-br from-primary via-primary-hover to-secondary/30 p-4 md:p-6 lg:p-8 border border-primary/30 shadow-primary"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 text-white">CompSmart</h1>
                  <AiBadge variant="solid" label="AI 2026" className="mb-2" />
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
          </motion.div>
          
          <PendingAdjustmentAlert />
          <SalaryTableSetupAlert />
          
          <div className="grid gap-4 grid-cols-1">
            <Item i={1}><PerformanceModuleCard /></Item>
            <Item i={2}>
              <ModuleGate mode="card" moduleSlug="nr1" featureName="Saúde Mental e Bem-Estar (NR-1)">
                <BemEstarModuleCard />
              </ModuleGate>
            </Item>
            <Item i={3}>
              <ModuleGate mode="card" moduleSlug="talent" featureName="Recrutamento & Seleção (Aquisição de Talentos)">
                <RecrutamentoModuleCard />
              </ModuleGate>
            </Item>
          </div>
          
          <Item i={3}><CompanyMapCard /></Item>
          <Item i={4}><OrganizationalIdentityCard /></Item>
          <Item i={5}><KPIDashboard currency={currency} showWithCharges={showWithCharges} /></Item>
          <Item i={6}><ExportCard /></Item>
        </div>
        
        {/* Coluna Direita: Indicadores + Navegação + Módulos */}
        <div className="space-y-4">
          <Item i={0}>
            <EconomicIndicators 
              currency={currency} 
              onCurrencyChange={setCurrency}
              showWithCharges={showWithCharges}
              onShowWithChargesChange={setShowWithCharges}
            />
          </Item>
          <Item i={1}><CompensationTrendsCard /></Item>
          <Item i={1}><MarketInsightsCard /></Item>
          <Item i={2}>
            <ModuleGate mode="card" moduleSlug="core" featureName="Coerência de Mérito">
              <MeritCoherenceCard />
            </ModuleGate>
          </Item>
          <Item i={3}>
            <ModuleGate mode="card" moduleSlug="potencial-sucessao" featureName="Inteligência de Talentos">
              <TalentIntelligenceCard />
            </ModuleGate>
          </Item>
          <Item i={4}>
            <ModuleGate mode="card" moduleSlug="core" featureName="Pay Equity">
              <PayEquityCard />
            </ModuleGate>
          </Item>
          <Item i={5}>
            <ModuleGate mode="card" moduleSlug="core" featureName="Remuneração de Executivos (ILP)">
              <ExecutiveCompCard />
            </ModuleGate>
          </Item>
          <Item i={6}><EconomicIndicatorsCard /></Item>
          <Item i={7}><AlphabeticalNav /></Item>
          <Item i={8}><ModuleGrid /></Item>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;