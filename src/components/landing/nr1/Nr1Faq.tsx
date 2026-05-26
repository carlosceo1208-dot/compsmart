import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQ = [
  {
    q: 'Quando a NR-1 atualizada começa a valer?',
    a: 'A Portaria MTE 1.419/2024 atualizou a NR-1 com a obrigatoriedade de gerenciamento de riscos psicossociais. A fiscalização efetiva começa em maio de 2026 — mas o programa precisa estar implementado antes disso para gerar evidências válidas.',
  },
  {
    q: 'Qual é o valor real das multas?',
    a: 'As multas por infração à NR-1 vão de R$ 670,89 (mínimo) a R$ 6.708,90 por colaborador, podendo ser aplicadas em dobro em caso de reincidência. Empresas com 100 colaboradores podem ser autuadas em mais de R$ 100 mil em um único auto de infração.',
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
    a: 'A CompSmart já vem com o módulo de avaliação de desempenho e matriz 9Box nativos. Se você já usa outra ferramenta, importamos. Se ainda não usa, montamos para você — sem custo adicional nos planos Pro e Enterprise.',
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
