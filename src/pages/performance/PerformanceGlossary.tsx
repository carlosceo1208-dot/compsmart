import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

const glossaryTerms = [
  {
    term: "Avaliação 90°",
    definition: "Avaliação realizada apenas pelo gestor direto do colaborador.",
  },
  {
    term: "Avaliação 180°",
    definition: "Inclui autoavaliação do colaborador e avaliação do gestor.",
  },
  {
    term: "Avaliação 360°",
    definition: "Avaliação completa incluindo gestor, pares, subordinados e autoavaliação.",
  },
  {
    term: "Calibração",
    definition: "Processo de alinhamento das notas entre gestores para garantir equidade.",
  },
  {
    term: "Competência Técnica (Hard Skill)",
    definition: "Habilidades e conhecimentos específicos para executar tarefas do cargo.",
  },
  {
    term: "Competência Comportamental (Soft Skill)",
    definition: "Habilidades interpessoais e comportamentais no ambiente de trabalho.",
  },
  {
    term: "Feedback",
    definition: "Retorno sobre desempenho, comportamento ou resultado de uma ação.",
  },
  {
    term: "Gap de Competência",
    definition: "Diferença entre o nível esperado e o nível avaliado de uma competência.",
  },
  {
    term: "Matriz 9Box",
    definition: "Ferramenta de análise cruzando Desempenho (eixo X) e Potencial (eixo Y).",
  },
  {
    term: "Meta SMART",
    definition: "Meta Específica, Mensurável, Atingível, Relevante e Temporal.",
  },
  {
    term: "PDI",
    definition: "Plano de Desenvolvimento Individual - ações para desenvolver competências.",
  },
  {
    term: "Performance Review",
    definition: "Processo formal de avaliação de desempenho em um período.",
  },
  {
    term: "Potencial",
    definition: "Capacidade de assumir responsabilidades maiores ou diferentes no futuro.",
  },
  {
    term: "Sucessão",
    definition: "Identificação e preparação de colaboradores para posições-chave.",
  },
];

export default function PerformanceGlossary() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
          Glossário de Desempenho
        </h1>
        <p className="text-sm text-muted-foreground">
          Termos e conceitos utilizados na gestão de desempenho
        </p>
      </div>

      <Card className="border-indigo-200/50 dark:border-indigo-800/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
            <BookOpen className="h-5 w-5" />
            Termos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {glossaryTerms.map((item) => (
              <div
                key={item.term}
                className="p-4 rounded-lg bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-200/30 dark:border-indigo-800/30"
              >
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
                  {item.term}
                </h3>
                <p className="text-sm text-muted-foreground">{item.definition}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
