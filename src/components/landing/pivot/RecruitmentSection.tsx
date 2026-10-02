import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, FileSpreadsheet, Info, Wallet, Filter, Target } from "lucide-react";

const PONTOS = [
  { icon: Wallet, title: "Faixa salarial sugerida", body: "Ao criar a vaga, a CompSmart sugere a faixa com base em CBO, descrição de cargo e nível/grade, integrada à estrutura da empresa." },
  { icon: Filter, title: "Triagem por perfil", body: "Candidatos organizados pelos requisitos reais do cargo, não por palavra-chave." },
  { icon: Target, title: "Match com o cargo", body: "Aderência medida contra a descrição e as competências da posição." },
];

const SISTEMAS = ["TOTVS", "Senior", "ADP", "Domínio", "Excel / CSV"];

export const RecruitmentSection = () => (
  <section className="py-16 md:py-20 bg-muted/30">
    <div className="container mx-auto px-4">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h2 className="text-2xl md:text-4xl font-bold">Recrutamento com inteligência</h2>
        <p className="mt-3 text-muted-foreground">
          A vaga já nasce ligada ao plano de cargos e salários.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PONTOS.map((p) => (
          <Card key={p.title} className="rounded-2xl">
            <CardContent className="p-6 space-y-3">
              <div className="p-2.5 rounded-xl bg-primary/10 w-fit"><p.icon className="h-5 w-5 text-primary" /></div>
              <h3 className="font-semibold">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link to="/modulos/selecao-rs" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Conhecer Recrutamento & Seleção <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="max-w-3xl mx-auto mt-12 text-center space-y-4">
        <h3 className="text-lg font-semibold">Conecta com a sua folha</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {SISTEMAS.map((s) => (
            <span key={s} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium">
              <FileSpreadsheet className="h-4 w-4 text-primary" /> {s}
            </span>
          ))}
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-left">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">É importação de dados, não processamento de folha.</strong>{" "}
            A CompSmart não calcula holerite nem substitui o seu sistema de folha.
          </p>
        </div>
      </div>
    </div>
  </section>
);
