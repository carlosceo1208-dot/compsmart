import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Users,
  ClipboardCheck,
  TrendingUp,
  Calendar,
  Award,
  LayoutGrid,
  Bot,
} from "lucide-react";

const quickStats = [
  {
    title: "Ciclo Ativo",
    value: "2025",
    subtitle: "Avaliação Anual",
    icon: Calendar,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
  },
  {
    title: "Avaliações",
    value: "0",
    subtitle: "Pendentes",
    icon: ClipboardCheck,
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    title: "Metas",
    value: "0",
    subtitle: "Definidas",
    icon: Target,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    title: "PDIs",
    value: "0",
    subtitle: "Em Andamento",
    icon: TrendingUp,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
];

const cycleStages = [
  { name: "Metas", status: "current", description: "Definição de metas" },
  { name: "Acompanhamento", status: "pending", description: "Feedback contínuo" },
  { name: "Insights", status: "pending", description: "9Box e análises" },
  { name: "Fechamento", status: "pending", description: "Devolutiva final" },
];

const quickActions = [
  { label: "Criar Ciclo", icon: Calendar, href: "/performance/cycles" },
  { label: "Nova Meta", icon: Target, href: "/performance/goals" },
  { label: "Avaliar", icon: ClipboardCheck, href: "/performance/evaluations" },
  { label: "9Box", icon: LayoutGrid, href: "/performance/9box" },
  { label: "Enviar Kudos", icon: Award, href: "/performance/kudos" },
  { label: "PerformAI", icon: Bot, href: "/performance/assistant" },
];

export default function PerformanceDashboard() {
  return (
    <div className="space-y-6">
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
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 ${
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-indigo-200/50 dark:border-indigo-800/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="border-indigo-200/50 dark:border-indigo-800/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
            <Users className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-200/30 dark:border-indigo-800/30"
                >
                  <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    {action.label}
                  </span>
                </a>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-indigo-200/50 dark:border-indigo-800/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
              <Award className="h-5 w-5" />
              Últimos Kudos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Award className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Nenhum kudos enviado ainda</p>
              <a
                href="/performance/kudos"
                className="text-sm text-indigo-600 hover:underline mt-2"
              >
                Enviar primeiro kudos →
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-200/50 dark:border-indigo-800/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
              <Bot className="h-5 w-5" />
              PerformAI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bot className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm text-center">
                Assistente de IA para avaliação de desempenho
              </p>
              <a
                href="/performance/assistant"
                className="text-sm text-indigo-600 hover:underline mt-2"
              >
                Iniciar conversa →
              </a>
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
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  Metas Cascateadas
                </Badge>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  9Box
                </Badge>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  Kudos
                </Badge>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  1:1s
                </Badge>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  PerformAI
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
