import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQ = [
  {
    q: 'Quando a NR-1 atualizada começa a valer?',
    a: 'A obrigação de identificar e gerenciar riscos psicossociais permanece. Prepare a documentação e o plano de ação da sua empresa para a fiscalização, considerando as orientações oficiais mais recentes.',
  },
  {
    q: 'Como minha empresa pode se preparar?',
    a: 'Comece pela identificação dos riscos, documente o diagnóstico e estabeleça um plano de ação acompanhado pelo RH e pela equipe responsável por SST. Acompanhe as orientações oficiais sobre fiscalização.',
  },
  {
    q: 'Vale para empresas com menos de 20 colaboradores?',
    a: 'Sim. A NR-1 se aplica a TODAS as empresas com colaboradores celetistas, independente do porte. O que muda é a complexidade do PGR, não a obrigação de gerenciar riscos psicossociais.',
  },
  {
    q: 'Como funciona o anonimato (LGPD)?',
    a: 'As respostas individuais nunca são exibidas. Os dashboards mostram agregados por dimensão, departamento ou grupo (mínimo 5 respondentes). Os dados pessoais são tratados conforme LGPD, com base legal de obrigação legal (cumprimento da NR-1) e legítimo interesse.',
  },
  {
    q: 'Posso usar um consultor externo junto com a plataforma?',
    a: 'Sim. A CompSmart oferece acesso multi-usuário com perfis diferenciados — consultor, RH interno, gestão. O consultor conduz o programa, a plataforma centraliza dados, evidências e plano de ação em um único lugar.',
  },
  {
    q: 'Como o cruzamento com 9Box funciona se eu ainda não uso 9Box?',
    a: 'O módulo NR-1 funciona sozinho. Para cruzamentos com 9-Box, contrate separadamente o módulo de Potencial & Sucessão; também é possível combinar Clima e Remuneração conforme sua necessidade.',
  },
];

export default function Nr1Faq() {
  return (
    <section className="container mx-auto px-4 py-14 max-w-3xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold">Perguntas frequentes</h2>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {FAQ.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

export const NR1_FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};
