import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import {
  Target,
  Users,
  ClipboardCheck,
  TrendingUp,
  Calendar,
  Award,
  LayoutGrid,
  Bot,
  Sparkles,
  ArrowRight,
  BarChart3,
  Zap,
} from "lucide-react";

import { EngagementCard } from "@/components/performance/EngagementCard";
import { AlertsCard } from "@/components/performance/AlertsCard";
import { ProfileExecutiveCard } from "@/components/performance/ProfileExecutiveCard";
import { Mini9BoxCard } from "@/components/performance/Mini9BoxCard";
import { RecentActivityCard } from "@/components/performance/RecentActivityCard";
import { PerformanceKPICards } from "@/components/performance/PerformanceKPICards";
import { GoalsProgressChart } from "@/components/performance/GoalsProgressChart";
import { FeedbackAnalyticsChart } from "@/components/performance/FeedbackAnalyticsChart";
import { PDIProgressChart } from "@/components/performance/PDIProgressChart";
import { EvaluationsOverviewChart } from "@/components/performance/EvaluationsOverviewChart";
import { usePerformanceAlerts } from "@/hooks/usePerformanceAlerts";
import { useEngagementMetrics } from "@/hooks/useEngagementMetrics";

const cycleStages = [
  { name: "Metas", status: "current", description: "Definição de metas", icon: Target },
  { name: "Acompanhamento", status: "pending", description: "Feedback contínuo", icon: Users },
  { name: "Insights", status: "pending", description: "9Box e análises", icon: LayoutGrid },
  { name: "Fechamento", status: "pending", description: "Devolutiva final", icon: ClipboardCheck },
];

export default function PerformanceDashboard() {
  const { activeCompanyId } = useCompanyContext();
  const { summary } = usePerformanceAlerts();
  const { metrics } = useEngagementMetrics();

  // Fetch current user profile
  const { data: currentUser } = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('profiles')
        .select('full_name, job_title, avatar_url, unit_id')
        .eq('id', user.id)
        .single();
      
      return data;
    },
  });

  // Fetch active cycle
  const { data: activeCycle } = useQuery({
    queryKey: ['active-cycle', activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return null;
      
      const { data } = await supabase
        .from('performance_cycles')
        .select('id, name, fiscal_year, status, is_active')
        .eq('root_company_id', activeCompanyId)
        .eq('is_active', true)
        .single();
      
      return data;
    },
    enabled: !!activeCompanyId,
  });

  return (
    <div className="space-y-6">
      {/* Header Section: Profile + KPIs */}
      <div className="grid lg:grid-cols-3 gap-4">
        <ProfileExecutiveCard 
          user={currentUser}
          stats={{
            pendingEvaluations: metrics.pendingEvaluations,
            activeGoals: metrics.activeGoals,
            activePdis: metrics.activePdis,
          }}
        />
        
        <div className="lg:col-span-2">
          <PerformanceKPICards 
            metrics={metrics}
            cycleInfo={activeCycle ? {
              name: activeCycle.name,
              year: activeCycle.fiscal_year,
              status: activeCycle.is_active ? 'active' : 'inactive',
            } : undefined}
          />
        </div>
      </div>

      {/* Cycle Progress - Visual Aprimorado */}
      <Card className="border-indigo-200/50 dark:border-indigo-800/30 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/50 dark:from-indigo-950/20 dark:via-background dark:to-purple-950/20 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
            <Calendar className="h-5 w-5" />
            Progresso do Ciclo de Avaliação
            {activeCycle && (
              <Badge variant="outline" className="ml-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700">
                {activeCycle.name} - {activeCycle.fiscal_year}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-8 left-8 right-8 h-1 bg-gradient-to-r from-indigo-200 via-indigo-100 to-purple-200 dark:from-indigo-800 dark:via-indigo-900 dark:to-purple-800 rounded-full" />
            
            <div className="relative flex items-center justify-between">
              {cycleStages.map((stage, index) => {
                const Icon = stage.icon;
                const isActive = stage.status === "current";
                const isCompleted = stage.status === "completed";
                
                return (
                  <div key={stage.name} className="flex flex-col items-center z-10">
                    <div
                      className={`relative w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-lg mb-3 transition-all shadow-lg ${
                        isActive
                          ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-indigo-300 dark:shadow-indigo-900 scale-110"
                          : isCompleted
                          ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-emerald-200 dark:shadow-emerald-900"
                          : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-2 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <Icon className="h-7 w-7" />
                      {isActive && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center animate-pulse">
                          <Zap className="h-2.5 w-2.5 text-amber-900" />
                        </div>
                      )}
                    </div>
                    <span className={`font-semibold text-sm ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-muted-foreground'}`}>
                      {stage.name}
                    </span>
                    <span className="text-xs text-muted-foreground text-center max-w-[100px]">
                      {stage.description}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row 1: Engagement + Alerts */}
      <div className="grid md:grid-cols-2 gap-4">
        <EngagementCard 
          enps={metrics.enps}
          breakdown={metrics.enpsBreakdown}
          adherenceRate={metrics.adherenceRate}
        />
        <AlertsCard summary={summary} />
      </div>

      {/* Charts Row 2: Goals + PDI + Feedback + Evaluations */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GoalsProgressChart 
          activeGoals={metrics.activeGoals}
          achievedGoals={metrics.achievedGoals}
        />
        <PDIProgressChart 
          activePdis={metrics.activePdis}
          completedPdis={metrics.completedPdis}
        />
        <FeedbackAnalyticsChart 
          kudosThisMonth={metrics.kudosThisMonth}
          oneOnOnesThisMonth={metrics.oneOnOnesThisMonth}
        />
        <EvaluationsOverviewChart 
          totalEvaluations={metrics.totalEvaluations}
          completedEvaluations={metrics.completedEvaluations}
          pendingEvaluations={metrics.pendingEvaluations}
          adherenceRate={metrics.adherenceRate}
        />
      </div>

      {/* Bottom Row: 9Box + Activity + PerformAI + People Analytics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Mini9BoxCard />
        <RecentActivityCard />
        
        {/* PerformAI Promo Card */}
        <Card className="border-indigo-200/50 dark:border-indigo-800/30 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 overflow-hidden hover:shadow-lg transition-shadow">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-300/50 dark:shadow-violet-900/30">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-violet-900 dark:text-violet-100 flex items-center gap-2">
                  PerformAI
                  <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] px-1.5 py-0 border-0">
                    IA
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Central de Inteligência
                </p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground flex-1 mb-4">
              Analise colaboradores, gere devolutivas personalizadas, sugira PDIs e muito mais com IA.
            </p>
            
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[10px] bg-white/50 dark:bg-background/30 border-violet-200">
                  <Sparkles className="h-2.5 w-2.5 mr-1" />
                  Devolutivas
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-white/50 dark:bg-background/30 border-violet-200">
                  <Target className="h-2.5 w-2.5 mr-1" />
                  PDI Automático
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-white/50 dark:bg-background/30 border-violet-200">
                  <LayoutGrid className="h-2.5 w-2.5 mr-1" />
                  Análise 9Box
                </Badge>
              </div>
              
              <Link to="/performance/assistant">
                <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all">
                  Iniciar Conversa
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* People Analytics Card */}
        <Card className="border-purple-200/50 dark:border-purple-800/30 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30 overflow-hidden hover:shadow-lg transition-shadow">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-700 flex items-center justify-center shadow-lg shadow-purple-300/50 dark:shadow-purple-900/30">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                  People Analytics
                  <Badge className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-[10px] px-1.5 py-0 border-0">
                    Dados
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Inteligência de RH
                </p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground flex-1 mb-4">
              Analise turnover, engajamento, distribuição salarial e tome decisões estratégicas baseadas em dados.
            </p>
            
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[10px] bg-white/50 dark:bg-background/30 border-purple-200">
                  <TrendingUp className="h-2.5 w-2.5 mr-1" />
                  Turnover
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-white/50 dark:bg-background/30 border-purple-200">
                  <Users className="h-2.5 w-2.5 mr-1" />
                  Headcount
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-white/50 dark:bg-background/30 border-purple-200">
                  <BarChart3 className="h-2.5 w-2.5 mr-1" />
                  Distribuição
                </Badge>
              </div>
              
              <Link to="/people-analytics">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 shadow-md hover:shadow-lg transition-all">
                  Acessar Analytics
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Info - Footer */}
      <Card className="border-indigo-200/50 dark:border-indigo-800/30 bg-gradient-to-r from-indigo-50 via-white to-purple-50 dark:from-indigo-950/30 dark:via-background dark:to-purple-950/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-indigo-900 dark:text-indigo-100 mb-1">
                Módulo de Avaliação de Desempenho
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Gerencie ciclos de avaliação, metas cascateadas, 9Box, PDIs e muito mais.
                Integrado com PLR/Incentivos e Programa de Mérito.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link to="/performance/goals">
                  <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 cursor-pointer transition-colors">
                    Metas Cascateadas
                  </Badge>
                </Link>
                <Link to="/performance/9box">
                  <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 cursor-pointer transition-colors">
                    9Box
                  </Badge>
                </Link>
                <Link to="/performance/kudos">
                  <Badge variant="outline" className="bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-700 hover:bg-pink-100 dark:hover:bg-pink-900/50 cursor-pointer transition-colors">
                    Reconhecimento
                  </Badge>
                </Link>
                <Link to="/performance/one-on-ones">
                  <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer transition-colors">
                    1:1s
                  </Badge>
                </Link>
                <Link to="/performance/pdi">
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer transition-colors">
                    PDIs
                  </Badge>
                </Link>
                <Link to="/performance/assistant">
                  <Badge variant="outline" className="bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900/50 cursor-pointer transition-colors">
                    PerformAI
                  </Badge>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
