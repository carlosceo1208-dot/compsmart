import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CONTACT_EMAIL } from "@/config/landingModules";

export const PIVOT_FAQ_ITEMS = [
  {
    question: "O que é a CompSmart?",
    answer:
      "É uma plataforma de gestão estratégica de pessoas com nove módulos independentes, cada um com um agente de inteligência artificial dedicado. Ela trabalha junto com o seu RH: cruza dados, automatiza análises e aponta decisões — de cargos e salários a risco psicossocial, clima, seleção, desenvolvimento e sucessão.",
  },
  {
    question: "Preciso contratar tudo ou posso comprar por módulo?",
    answer:
      "A compra é modular. Você contrata só os módulos que precisa e ativa os demais quando quiser. O primeiro módulo tem o valor integral por colaborador e cada módulo adicional entra com desconto fixo de 50%.",
  },
  {
    question: "A NR-1 é obrigatória?",
    answer:
      "Sim. O gerenciamento dos riscos psicossociais passou a ser exigido pela NR-1, com a Portaria MTE 1.419/2024, e precisa estar documentado. O módulo NR-1 é um produto autônomo: diagnóstico anônimo COPSOQ-III, matriz de risco, plano de ação e relatórios para fiscalização, sem depender de nenhum outro módulo.",
  },
  {
    question: "Como importo a base da minha folha?",
    answer:
      "Você envia a planilha Excel ou CSV exportada do seu sistema de folha. A plataforma sugere o mapeamento das colunas, valida CPF, datas, campos obrigatórios e duplicidades, mostra um preview e grava só as linhas válidas, com log de erros para correção. É importação de dados — a CompSmart não processa folha de pagamento.",
  },
  {
    question: "Quem usa a plataforma no dia a dia?",
    answer:
      "O time de RH e remuneração conduz; gestores participam de avaliações, metas e planos de ação; a diretoria acompanha os painéis executivos; e os colaboradores respondem diagnósticos e pesquisas de forma anônima. Cada perfil vê apenas o que lhe cabe.",
  },
];

export const PivotFAQSection = () => (
  <section id="faq" className="py-16 md:py-20 bg-background">
    <div className="container mx-auto px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-bold">
            Perguntas frequentes
          </h2>
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
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-primary font-semibold hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </div>
  </section>
);
