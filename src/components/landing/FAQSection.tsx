import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const FAQSection = () => {
  const faqs = [
    {
      question: "Como funciona o benchmark de mercado com IA?",
      answer: "Nosso agente de IA cruza dados de pesquisas salariais públicas e privadas, analisa tendências de mercado e compara sua estrutura salarial com empresas similares por porte, setor e região. O sistema gera recomendações automáticas para ajustes e identifica distorções salariais."
    },
    {
      question: "É seguro armazenar dados dos colaboradores?",
      answer: "Sim. Utilizamos criptografia de nível enterprise, somos LGPD compliant e seguimos os mais altos padrões de segurança da informação. Todos os dados são armazenados em servidores seguros com backup automatizado e controle de acesso baseado em perfis."
    },
    {
      question: "Preciso ter conhecimento em RH para usar o CompSmart?",
      answer: "Não. O sistema foi desenvolvido para ser intuitivo e guiar você passo a passo. Os agentes Smart fornecem orientações contextuais e sugestões automáticas. Além disso, oferecemos suporte humanizado e consultoria embutida para ajudar em decisões estratégicas."
    },
    {
      question: "Como o agente verifica compliance trabalhista?",
      answer: "O Assistente Jurídico Smart monitora constantemente a legislação trabalhista e previdenciária brasileira, identifica riscos em políticas de remuneração, gera alertas automáticos e fornece referências legais atualizadas. Ele também auxilia na criação de contratos e políticas em conformidade."
    },
    {
      question: "Posso customizar os benefícios e incentivos da minha empresa?",
      answer: "Sim, totalmente. Você pode criar programas de PLR, PPR, bônus e comissões com regras personalizadas, definir elegibilidade por grade/nível, configurar matching para previdência, criar pacotes de benefícios flexíveis e muito mais. O sistema se adapta à sua política."
    },
    {
      question: "Quais dados preciso para começar?",
      answer: "Para começar, você precisa apenas da estrutura organizacional (unidades, áreas) e lista de cargos. Os demais dados (salários, benefícios, colaboradores) podem ser importados gradualmente via planilha Excel ou cadastrados diretamente no sistema."
    },
    {
      question: "Posso fazer upgrade ou downgrade do plano a qualquer momento?",
      answer: "Sim. Você pode alterar seu plano a qualquer momento sem burocracia. O ajuste é proporcional e você só paga pela diferença. Não há custos de migração nem penalidades por cancelamento."
    },
    {
      question: "O CompSmart integra com outros sistemas de RH?",
      answer: "Sim, no plano Enterprise oferecemos integrações customizadas via API e webhooks com sistemas de folha de pagamento, ERP e outras ferramentas de RH. Entre em contato com nossa equipe para discutir suas necessidades específicas de integração."
    }
  ];

  return (
    <section id="faq" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Perguntas{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Frequentes
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Tire suas dúvidas sobre o CompSmart
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-background rounded-lg border border-border px-6 hover:border-primary/50 transition-colors"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5">
                  <span className="font-semibold pr-4">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Ainda tem dúvidas? Entre em contato com nossa equipe pelo email{" "}
              <a href="mailto:contato@compsmart.com.br" className="text-primary hover:underline font-semibold">
                contato@compsmart.com.br
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
