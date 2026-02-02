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
} from "lucide-react";

import { EngagementCard } from "@/components/performance/EngagementCard";
import { AlertsCard } from "@/components/performance/AlertsCard";
import { ProfileExecutiveCard } from "@/components/performance/ProfileExecutiveCard";
import { Mini9BoxCard } from "@/components/performance/Mini9BoxCard";
import { RecentActivityCard } from "@/components/performance/RecentActivityCard";
import { PerformanceKPICards } from "@/components/performance/PerformanceKPICards";
import { usePerformanceAlerts } from "@/hooks/usePerformanceAlerts";
import { useEngagementMetrics } from "@/hooks/useEngagementMetrics";

const cycleStages = [
  { name: "Metas", status: "current", description: "Definição de metas" },
  { name: "Acompanhamento", status: "pending", description: "Feedback contínuo" },
  { name: "Insights", status: "pending", description: "9Box e análises" },
  { name: "Fechamento", status: "pending", description: "Devolutiva final" },
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
      {/* Top Row: Profile + KPIs */}
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

      {/* Cycle Progress */}
      <Card className="border-indigo-200/50 dark:border-indigo-800/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
            <Calendar className="h-5 w-5" />
            Progresso do Ciclo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            {cycleStages.map((stage, index) => (
              <div key={stage.name} className="flex-1 relative">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 transition-all ${
                      stage.status === "current"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                        : stage.status === "completed"
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="font-medium text-sm">{stage.name}</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {stage.description}
                  </span>
                </div>
                {index < cycleStages.length - 1 && (
                  <div className="absolute top-6 left-[60%] w-[80%] h-0.5 bg-gray-200 dark:bg-gray-700" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Middle Row: Engagement + Alerts */}
      <div className="grid md:grid-cols-2 gap-4">
        <EngagementCard 
          enps={metrics.enps}
          breakdown={metrics.enpsBreakdown}
          adherenceRate={metrics.adherenceRate}
        />
        <AlertsCard summary={summary} />
      </div>

      {/* Bottom Row: 9Box + Activity + PerformAI + People Analytics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Mini9BoxCard />
        <RecentActivityCard />
        
        {/* PerformAI Promo Card */}
        <Card className="border-indigo-200/50 dark:border-indigo-800/30 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 overflow-hidden">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-violet-900 dark:text-violet-100 flex items-center gap-2">
                  PerformAI
                  <Badge className="bg-violet-600 text-white text-[10px] px-1.5 py-0">
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
                <Badge variant="outline" className="text-[10px] bg-white/50 dark:bg-background/30">
                  <Sparkles className="h-2.5 w-2.5 mr-1" />
                  Devolutivas
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-white/50 dark:bg-background/30">
                  <Target className="h-2.5 w-2.5 mr-1" />
                  PDI Automático
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-white/50 dark:bg-background/30">
                  <LayoutGrid className="h-2.5 w-2.5 mr-1" />
                  Análise 9Box
                </Badge>
              </div>
              
              <Link to="/performance/assistant">
                <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                  Iniciar Conversa
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* People Analytics Card */}
        <Card className="border-purple-200/50 dark:border-purple-800/30 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30 overflow-hidden">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-700 flex items-center justify-center shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                  People Analytics
                  <Badge className="bg-purple-600 text-white text-[10px] px-1.5 py-0">
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
                <Badge variant="outline" className="text-[10px] bg-white/50 dark:bg-background/30">
                  <TrendingUp className="h-2.5 w-2.5 mr-1" />
                  Turnover
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-white/50 dark:bg-background/30">
                  <Users className="h-2.5 w-2.5 mr-1" />
                  Headcount
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-white/50 dark:bg-background/30">
                  <BarChart3 className="h-2.5 w-2.5 mr-1" />
                  Distribuição
                </Badge>
              </div>
              
              <Link to="/people-analytics">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700">
                  Acessar Analytics
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Info */}
      <Card className="border-indigo-200/50 dark:border-indigo-800/30 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-950/30 dark:to-background">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-600 rounded-lg">
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
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 cursor-pointer transition-colors">
                    Metas Cascateadas
                  </Badge>
                </Link>
                <Link to="/performance/9box">
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 cursor-pointer transition-colors">
                    9Box
                  </Badge>
                </Link>
                <Link to="/performance/kudos">
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 cursor-pointer transition-colors">
                    Kudos
                  </Badge>
                </Link>
                <Link to="/performance/one-on-ones">
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 cursor-pointer transition-colors">
                    1:1s
                  </Badge>
                </Link>
                <Link to="/performance/assistant">
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 cursor-pointer transition-colors">
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
