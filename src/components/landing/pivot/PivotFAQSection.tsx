import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CONTACT_EMAIL } from "@/config/landingModules";

/** Mesmo array alimenta a seção e o JSON-LD da Home. */
export const PIVOT_FAQ_ITEMS = [
  {
    question: "O anonimato é real?",
    answer:
      "Sim. As respostas dos diagnósticos não são ligadas à identidade de quem respondeu, e os resultados só aparecem por grupo com no mínimo 5 respondentes. Grupos menores ficam ocultos na tela e nas exportações.",
  },
  {
    question: "A plataforma gera laudo e PGR?",
    answer:
      "A plataforma gera o diagnóstico, a matriz de risco, o plano de ação e relatórios que apoiam o inventário de riscos do PGR. A assinatura técnica do laudo e do PGR continua sendo do profissional responsável pela segurança e saúde no trabalho da empresa.",
  },
  {
    question: "A pesquisa de clima substitui a NR-1?",
    answer:
      "Não. Clima mede percepção e engajamento; a NR-1 exige identificar e gerenciar riscos psicossociais com método próprio. Na CompSmart são módulos separados — e podem ser cruzados.",
  },
  {
    question: "Quem é obrigado a cumprir a NR-1?",
    answer:
      "Todas as organizações com colaboradores regidos pela CLT precisam incluir os riscos psicossociais no gerenciamento de riscos ocupacionais, conforme a Portaria MTE 1.419/2024.",
  },
  {
    question: "Quanto custa?",
    answer:
      "O valor é por colaborador e por módulo: o 1º módulo tem o valor cheio e cada módulo adicional entra com desconto. Use o simulador desta página ou a página de Preços para ver o total da sua empresa.",
  },
  {
    question: "Posso importar minha matriz de risco atual?",
    answer:
      "Sim. Você envia a matriz que já usa (COPSOQ, HSE, JCQ, ERI ou planilha própria); ela passa por conferência antes de ser aceita, com registro de quem conferiu.",
  },
  {
    question: "Qual a diferença entre a plataforma e a consultoria?",
    answer:
      "A plataforma é a estrutura: módulos, agentes de IA e dados cruzados. A consultoria (HR Services) são consultores seniores por demanda que interpretam os dados com o seu RH e conduzem o plano de ação.",
  },
];

export const PivotFAQSection = () => (
  <section id="faq" className="py-16 md:py-20 bg-background">
    <div className="container mx-auto px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-bold">Perguntas frequentes</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {PIVOT_FAQ_ITEMS.map((f, i) => (
            <AccordionItem
              key={f.question}
              value={`faq-${i}`}
              className="rounded-2xl border border-border bg-card px-5"
            >
              <AccordionTrigger className="text-left hover:no-underline py-5 font-semibold">
                {f.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                {f.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Ficou outra dúvida? Escreva para{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary font-semibold hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </div>
  </section>
);
