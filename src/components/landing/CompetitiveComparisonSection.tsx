import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  {
    name: "Remuneração + Desempenho Integrados",
    compsmart: { status: "yes", text: "Nativo e unificado" },
    solides: { status: "no", text: "Não tem remuneração" },
    impulseup: { status: "no", text: "Só desempenho" },
    gupy: { status: "no", text: "Só R&S e admissão" },
  },
  {
    name: "Tabelas e Faixas Salariais Automáticas",
    compsmart: { status: "yes", text: "Curvas e amplitudes" },
    solides: { status: "no", text: "Não tem" },
    impulseup: { status: "no", text: "Não tem" },
    gupy: { status: "no", text: "Não tem" },
  },
  {
    name: "Agentes de IA Especializados",
    compsmart: { status: "yes", text: "4 agentes incluídos" },
    solides: { status: "warn", text: "IA básica" },
    impulseup: { status: "warn", text: "IA em header" },
    gupy: { status: "warn", text: "Gaia (R&S)" },
  },
  {
    name: "ICP + ILP (PLR, Stock Options, RSU)",
    compsmart: { status: "yes", text: "Incluído" },
    solides: { status: "no", text: "Não tem" },
    impulseup: { status: "no", text: "Não tem" },
    gupy: { status: "no", text: "Não tem" },
  },
  {
    name: "Trial sem cartão",
    compsmart: { status: "yes", text: "30 dias" },
    solides: { status: "no", text: "Sem trial" },
    impulseup: { status: "warn", text: "14 dias" },
    gupy: { status: "no", text: "Sem trial" },
  },
  {
    name: "Simulação de Dissídio e Cenários",
    compsmart: { status: "yes", text: "Fixo + Escalonado" },
    solides: { status: "no", text: "Não tem" },
    impulseup: { status: "no", text: "Não tem" },
    gupy: { status: "no", text: "Não tem" },
  },
  {
    name: "Gestão de Benefícios por Grade",
    compsmart: { status: "yes", text: "Regras automáticas" },
    solides: { status: "warn", text: "Básico" },
    impulseup: { status: "no", text: "Não tem" },
    gupy: { status: "no", text: "Não tem" },
  },
  {
    name: "Reconhecimento & Kudos + 1:1s",
    compsmart: { status: "yes", text: "Integrado" },
    solides: { status: "no", text: "Não tem" },
    impulseup: { status: "warn", text: "Módulo extra" },
    gupy: { status: "no", text: "Não tem" },
  },
  {
    name: "Equidade Interna Auditável",
    compsmart: { status: "yes", text: "Por área, gênero, nível" },
    solides: { status: "no", text: "Não tem" },
    impulseup: { status: "no", text: "Não tem" },
    gupy: { status: "no", text: "Não tem" },
  },
  {
    name: "Setup autoguiado",
    compsmart: { status: "yes", text: "15 minutos" },
    solides: { status: "no", text: "Precisa consultor" },
    impulseup: { status: "warn", text: "Onboarding guiado" },
    gupy: { status: "no", text: "Implantação longa" },
  },
  {
    name: "Preço por colaborador",
    compsmart: { status: "yes", text: "A partir de R$ 3,80" },
    solides: { status: "no", text: '"Sob consulta"' },
    impulseup: { status: "warn", text: "~R$ 9+/colab" },
    gupy: { status: "no", text: '"Sob consulta"' },
  },
];

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "yes") return <CheckCircle2 className="h-4 w-4 text-secondary flex-shrink-0" />;
  if (status === "warn") return <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />;
  return <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />;
};

export const CompetitiveComparisonSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-4">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">
            <Sparkles className="h-3 w-3 mr-1" /> Comparativo 2026
          </Badge>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">
          CompSmart vs. <span className="text-primary">Concorrentes</span>
        </h2>
        <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
          A única plataforma que integra Remuneração Estratégica + Desempenho em uma solução completa. 
          Compare funcionalidades reais, não promessas.
        </p>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground w-[200px]">Funcionalidade</th>
                <th className="py-3 px-4 font-bold text-primary bg-primary/5 border-x border-primary/10">
                  <div className="flex flex-col items-center">
                    <span>CompSmart</span>
                    <span className="text-[10px] font-normal text-primary/70">Rem. + Desempenho</span>
                  </div>
                </th>
                <th className="py-3 px-4 font-medium text-muted-foreground">
                  <div className="flex flex-col items-center">
                    <span>Sólides</span>
                    <span className="text-[10px] font-normal">RH Geral</span>
                  </div>
                </th>
                <th className="py-3 px-4 font-medium text-muted-foreground">
                  <div className="flex flex-col items-center">
                    <span>ImpulseUp</span>
                    <span className="text-[10px] font-normal">Só Desempenho</span>
                  </div>
                </th>
                <th className="py-3 px-4 font-medium text-muted-foreground">
                  <div className="flex flex-col items-center">
                    <span>Gupy</span>
                    <span className="text-[10px] font-normal">R&S + Admissão</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={i} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{f.name}</td>
                  <td className="py-3 px-4 bg-primary/5 border-x border-primary/10">
                    <div className="flex items-center gap-2 justify-center">
                      <StatusIcon status={f.compsmart.status} />
                      <span className="text-secondary font-medium text-xs">{f.compsmart.text}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-muted-foreground">
                    <div className="flex items-center gap-1.5 justify-center">
                      <StatusIcon status={f.solides.status} />
                      <span className="text-xs">{f.solides.text}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-muted-foreground">
                    <div className="flex items-center gap-1.5 justify-center">
                      <StatusIcon status={f.impulseup.status} />
                      <span className="text-xs">{f.impulseup.text}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-muted-foreground">
                    <div className="flex items-center gap-1.5 justify-center">
                      <StatusIcon status={f.gupy.status} />
                      <span className="text-xs">{f.gupy.text}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary highlight */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-2xl font-bold text-primary">30 dias</p>
            <p className="text-xs text-muted-foreground">Trial grátis sem cartão</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-secondary/5 border border-secondary/20">
            <p className="text-2xl font-bold text-secondary">4 Agentes IA</p>
            <p className="text-xs text-muted-foreground">Incluídos em todos os planos Pro</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-2xl font-bold text-primary">R$ 3,80</p>
            <p className="text-xs text-muted-foreground">Por colaborador/mês</p>
          </div>
        </div>

        <div className="text-center mt-8">
          <Button className="cta-action" onClick={() => navigate("/auth")}>
            Experimentar a Diferença (30 dias grátis)
          </Button>
        </div>
      </div>
    </section>
  );
};
