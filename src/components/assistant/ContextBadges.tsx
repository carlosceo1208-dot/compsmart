import { Badge } from "@/components/ui/badge";
import { Scale, Target, Sparkles, TrendingUp } from "lucide-react";

interface ContextBadgesProps {
  agent: 'legal' | 'incentive' | 'salary';
  activeMode?: string;
}

const agentConfig = {
  legal: {
    badges: [
      { label: 'Legislação', icon: Scale },
      { label: 'Contratos', icon: Scale },
      { label: 'Compliance', icon: Scale },
    ],
    modes: {
      validar_politica: '🔍 Validação de Política',
      interpretar_lei: '📖 Interpretação de Lei',
      compliance_check: '✓ Verificação de Compliance',
    },
  },
  incentive: {
    badges: [
      { label: 'Compensation', icon: Target },
      { label: 'Incentivos', icon: Target },
      { label: 'Benefícios', icon: Target },
    ],
    modes: {
      gerar_politica: '📝 Geração de Política',
      comparar_mercado: '📊 Comparação com Mercado',
      mix_total_rewards: '💰 Mix de Remuneração Total',
    },
  },
  salary: {
    badges: [
      { label: 'Estruturas', icon: TrendingUp },
      { label: 'Faixas Salariais', icon: TrendingUp },
      { label: 'Benchmarking', icon: TrendingUp },
    ],
    modes: {
      analise_equidade: '⚖️ Análise de Equidade',
      benchmark_mercado: '📊 Benchmark de Mercado',
      recomendacao_ajuste: '💡 Recomendação de Ajuste',
      compa_ratio: '📈 Compa-Ratio',
      distorcoes: '🔍 Identificação de Distorções',
    },
  },
};

export const ContextBadges = ({ agent, activeMode }: ContextBadgesProps) => {
  const config = agentConfig[agent];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {config.badges.map((badge) => {
        const Icon = badge.icon;
        return (
          <Badge key={badge.label} variant="outline" className="gap-1">
            <Icon className="w-3 h-3" />
            {badge.label}
          </Badge>
        );
      })}

      {activeMode && config.modes[activeMode as keyof typeof config.modes] && (
        <Badge variant="default" className="gap-1 bg-primary">
          <Sparkles className="w-3 h-3" />
          {config.modes[activeMode as keyof typeof config.modes]}
        </Badge>
      )}
    </div>
  );
};