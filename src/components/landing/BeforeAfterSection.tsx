import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { XCircle, CheckCircle2, Clock, FileSpreadsheet, Brain, AlertTriangle, Users, BarChart3, Zap, Shield, TrendingUp, Award } from "lucide-react";

const problems = [
  { icon: Clock, text: "14 dias para fechar revisão salarial" },
  { icon: FileSpreadsheet, text: "5+ planilhas desconectadas" },
  { icon: Brain, text: 'Decisões baseadas em "feeling"' },
  { icon: AlertTriangle, text: "Erros de fórmula e retrabalho constante" },
  { icon: BarChart3, text: "CFO sem previsibilidade de custo" },
  { icon: Users, text: "Talentos saindo por injustiça percebida" },
];

const benefits = [
  { icon: Zap, text: "2 horas para simular 5 cenários diferentes" },
  { icon: Shield, text: "Tudo integrado em uma única plataforma" },
  { icon: BarChart3, text: "Decisões baseadas em dados auditáveis" },
  { icon: Brain, text: "Automação inteligente com IA" },
  { icon: TrendingUp, text: "CFO com controle financeiro em tempo real" },
  { icon: Award, text: "Meritocracia transparente e justa" },
];

export const BeforeAfterSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Sua gestão de pessoas <strong>HOJE</strong> vs. <strong className="text-secondary">COM CompSmart</strong>
          </h2>
          <p className="text-muted-foreground text-lg">Veja a transformação lado a lado</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* SEM COMPSMART */}
          <div className="rounded-xl overflow-hidden border border-border">
            <div className="bg-muted-foreground px-6 py-3 text-center">
              <span className="text-primary-foreground font-bold text-sm">❌ SEM COMPSMART</span>
            </div>
            <div className="bg-card p-6 space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
                  <FileSpreadsheet className="h-12 w-12 text-destructive" />
                </div>
              </div>
              <ul className="space-y-3">
                {problems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <span className="text-sm"><strong>{item.text}</strong></span>
                  </li>
                ))}
              </ul>
              <p className="text-sm italic text-muted-foreground pt-2">
                O RH vira "apagador de incêndio" enquanto as planilhas dominam o processo.
              </p>
            </div>
          </div>

          {/* COM COMPSMART */}
          <div className="rounded-xl overflow-hidden border border-secondary/30">
            <div className="bg-secondary px-6 py-3 text-center">
              <span className="text-secondary-foreground font-bold text-sm">✅ COM COMPSMART</span>
            </div>
            <div className="bg-card p-6 space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 rounded-full bg-secondary/10 flex items-center justify-center">
                  <BarChart3 className="h-12 w-12 text-secondary" />
                </div>
              </div>
              <ul className="space-y-3">
                {benefits.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-sm"><strong>{item.text}</strong></span>
                  </li>
                ))}
              </ul>
              <p className="text-sm italic text-secondary-dark pt-2">
                RH se torna estratégico. Decisões ganham velocidade e precisão.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-10">
          <Button
            size="lg"
            className="bg-secondary hover:bg-secondary-hover text-secondary-foreground font-semibold"
            onClick={() => navigate("/auth")}
          >
            Quero Essa Transformação Agora
          </Button>
        </div>
      </div>
    </section>
  );
};
