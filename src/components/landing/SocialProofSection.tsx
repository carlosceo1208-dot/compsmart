import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, TrendingUp, DollarSign, Building2, Users, BarChart3 } from "lucide-react";

const notifications = [
  { company: "TechCorp", employees: 850, action: "simulou revisão salarial", time: "há 2min" },
  { company: "Indústria XYZ", employees: 600, action: "economizou 120h/mês", time: "há 5min" },
  { company: "Varejo ABC", employees: 1200, action: "integrou avaliação + remuneração", time: "há 8min" },
  { company: "Consultoria DEF", employees: 380, action: "aprovou 47 decisões salariais", time: "há 12min" },
  { company: "Grupo GHI", employees: 2500, action: "identificou R$ 230k em distorções", time: "há 15min" },
];

const microCases = [
  {
    icon: Clock,
    headline: "De 2 semanas para 1 dia",
    quote: "Antes: cruzar avaliação e salários levava 2 semanas com 3 pessoas. Hoje: faço sozinha em 1 dia.",
    name: "Paula M.",
    role: "Diretora de RH • Tecnologia, 1.200 colab.",
    metric: "⏱️ 93% de redução de tempo",
    color: "text-primary",
  },
  {
    icon: DollarSign,
    headline: "R$ 47 mil economizados no 1° ano",
    quote: "Identificamos distorções salariais que estavam custando caro e gerando turnover invisível.",
    name: "Ricardo A.",
    role: "CFO • Indústria, 600 colab.",
    metric: "💰 R$ 47k economizados",
    color: "text-secondary",
  },
  {
    icon: TrendingUp,
    headline: "Retenção subiu 23% em 6 meses",
    quote: "Talentos agora confiam no processo de meritocracia. Transparência virou vantagem competitiva.",
    name: "Fernanda C.",
    role: "CEO • Serviços, 380 colab.",
    metric: "📈 +23% retenção",
    color: "text-warning",
  },
];

export const SocialProofSection = () => {
  const [activeNotif, setActiveNotif] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNotif((prev) => (prev + 1) % notifications.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 max-w-5xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
          Empresas eliminando planilhas <strong className="text-primary">agora</strong>
        </h2>

        {/* Live notifications */}
        <div className="flex justify-center mb-12">
          <div className="relative h-12 w-full max-w-lg overflow-hidden">
            {notifications.map((n, i) => (
              <div
                key={i}
                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                  i === activeNotif ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                <Badge variant="outline" className="bg-card px-4 py-2 text-sm shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary inline-block mr-2 animate-pulse" />
                  <strong>{n.company}</strong>&nbsp;({n.employees} colab.) {n.action} — <span className="text-muted-foreground">{n.time}</span>
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Micro-cases */}
        <div className="grid md:grid-cols-3 gap-6">
          {microCases.map((c, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <c.icon className={`h-5 w-5 ${c.color}`} />
                  </div>
                  <h3 className="font-bold text-sm">{c.headline}</h3>
                </div>
                <p className="text-sm text-muted-foreground italic">"{c.quote}"</p>
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.role}</p>
                </div>
                <Badge className="bg-secondary/10 text-secondary border-secondary/20">{c.metric}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-10 text-sm text-muted-foreground">
          <span className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Empresas de 50 a 5000 colaboradores</span>
          <span className="flex items-center gap-2"><Users className="h-4 w-4" /> RH, Finanças e C-Level</span>
          <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Todos os setores</span>
        </div>
      </div>
    </section>
  );
};
