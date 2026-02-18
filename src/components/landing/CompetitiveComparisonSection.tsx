import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  {
    name: "Tabelas e Faixas Salariais Automáticas",
    compsmart: { status: "yes", text: "Curvas e amplitudes" },
    tradA: { status: "warn", text: "Básico" },
    tradB: { status: "no", text: "Não tem" },
  },
  {
    name: "Simulação de Dissídio e Cenários",
    compsmart: { status: "yes", text: "Fixo + Escalonado" },
    tradA: { status: "no", text: "Não tem" },
    tradB: { status: "no", text: "Não tem" },
  },
  {
    name: "ICP + ILP (PLR, Stock Options, RSU)",
    compsmart: { status: "yes", text: "Incluído" },
    tradA: { status: "warn", text: "Só PLR" },
    tradB: { status: "no", text: "Não tem" },
  },
  {
    name: "Desempenho + Remuneração Integrados",
    compsmart: { status: "yes", text: "Nativo" },
    tradA: { status: "no", text: "Módulos separados" },
    tradB: { status: "warn", text: "Via API externa" },
  },
  {
    name: "Agentes de IA Especializados",
    compsmart: { status: "yes", text: "4 agentes incluídos" },
    tradA: { status: "no", text: "Não tem" },
    tradB: { status: "warn", text: "Add-on pago" },
  },
  {
    name: "Equidade Interna Auditável",
    compsmart: { status: "yes", text: "Por área, gênero, nível" },
    tradA: { status: "warn", text: "Limitada" },
    tradB: { status: "no", text: "Não tem" },
  },
  {
    name: "Trial sem cartão",
    compsmart: { status: "yes", text: "14 dias" },
    tradA: { status: "no", text: "Precisa falar com consultor" },
    tradB: { status: "no", text: "7 dias c/ cartão" },
  },
  {
    name: "Setup",
    compsmart: { status: "yes", text: "Autoguiado (15min)" },
    tradA: { status: "no", text: "Precisa consultor" },
    tradB: { status: "no", text: "3-4 semanas" },
  },
  {
    name: "Preço por colaborador",
    compsmart: { status: "yes", text: "A partir de R$ 3,80/colab" },
    tradA: { status: "no", text: '"Sob consulta"' },
    tradB: { status: "no", text: "R$ 9+/colab (só AVD)" },
  },
];

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "yes") return <CheckCircle2 className="h-4 w-4 text-secondary" />;
  if (status === "warn") return <AlertTriangle className="h-4 w-4 text-warning" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
};

export const CompetitiveComparisonSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
          Por que CompSmart vs. <span className="text-primary">Outras Soluções</span>?
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Feature</th>
                <th className="py-3 px-4 font-bold text-primary">CompSmart</th>
                <th className="py-3 px-4 font-medium text-muted-foreground">Solução Tradicional</th>
                <th className="py-3 px-4 font-medium text-muted-foreground">Ferramenta Isolada</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{f.name}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 justify-center">
                      <StatusIcon status={f.compsmart.status} />
                      <span className="text-secondary font-medium">{f.compsmart.text}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-muted-foreground">
                    <div className="flex items-center gap-2 justify-center">
                      <StatusIcon status={f.tradA.status} />
                      <span>{f.tradA.text}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-muted-foreground">
                    <div className="flex items-center gap-2 justify-center">
                      <StatusIcon status={f.tradB.status} />
                      <span>{f.tradB.text}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center mt-8">
          <Button className="cta-action" onClick={() => navigate("/auth")}>
            Experimentar a Diferença (14 dias grátis)
          </Button>
        </div>
      </div>
    </section>
  );
};