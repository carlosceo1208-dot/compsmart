import { Award, Bot, DollarSign, Globe2, HeartHandshake, Lock, Sparkles, TrendingUp, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useScrollReveal, getStaggeredStyle } from "@/hooks/useScrollReveal";

export const DifferentialsSection = () => {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  const differentials = [
    {
      icon: Zap,
      title: "Remuneração + Desempenho Integrados",
      description: "Única plataforma que conecta avaliação 360°, 9Box e PDI diretamente a decisões de mérito, bônus e promoções — eliminando achismos e garantindo meritocracia real baseada em dados"
    },
    {
      icon: DollarSign,
      title: "Menor Custo do Mercado",
      description: "Plataforma completa por menos de US$ 1 por colaborador/mês. Enquanto concorrentes cobram R$ 9+/colab só para avaliação, o CompSmart entrega remuneração + desempenho + IA por menos de R$ 6/colab"
    },
    {
      icon: Sparkles,
      title: "4 Agentes de IA Especializados",
      description: "Jurídico Smart (compliance e acordos coletivos), Salary Smart (análise salarial), R&B Smart (benefícios e incentivos) e PerformAI (feedbacks e PDIs) — trabalhando COM você em tempo real"
    },
    {
      icon: Globe2,
      title: "Brasil + LATAM Nativo",
      description: "Desenvolvido para a realidade brasileira: CLT, CBO, INPC, encargos, vale-transporte com desconto legal de 6%, e pronto para expansão na América Latina com suporte a múltiplas moedas"
    },
    {
      icon: Award,
      title: "Feedback Externo 360°",
      description: "Avaliadores de fora da empresa — clientes, fornecedores e parceiros — participam dos ciclos de feedback via formulário seguro com link único, ampliando a visão sobre o colaborador"
    },
    {
      icon: HeartHandshake,
      title: "Consultoria Embutida",
      description: "Metodologias Hay e Mercer integradas, job matching inteligente, curvas salariais automáticas e recomendações de IA — como ter um consultor de remuneração 24/7 dentro da plataforma"
    },
    {
      icon: TrendingUp,
      title: "Alertas Proativos com IA",
      description: "O sistema identifica riscos de retenção, defasagens salariais, avaliações pendentes e distorções de equidade antes que virem problemas — antecipando decisões para o RH e gestores"
    },
    {
      icon: Bot,
      title: "ICP + ILP Completo",
      description: "Gestão integrada de incentivos de curto prazo (bônus, PLR, comissões) e longo prazo (Stock Options, RSU, Phantom Shares, Previdência) com vesting, cliff e simulações por grade"
    },
    {
      icon: Lock,
      title: "Segurança & LGPD Enterprise",
      description: "Criptografia de ponta, controle de acesso por perfil, auditoria de equidade salarial (gênero, área, nível) e conformidade total com a LGPD — seus dados protegidos com padrão corporativo"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-secondary/10 via-background to-primary/5" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div 
            className="text-center mb-16"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(30px)",
              transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
            }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Por que somos{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                diferentes?
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              A única plataforma que integra Remuneração Estratégica, Avaliação de Desempenho e Inteligência Artificial — por menos de 1 dólar por colaborador
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {differentials.map((diff, index) => (
              <Card 
                key={index} 
                className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-background/80 backdrop-blur-sm border-primary/20"
                style={getStaggeredStyle(isVisible, index, 0.1)}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-primary rounded-xl flex-shrink-0">
                    <diff.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{diff.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {diff.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
