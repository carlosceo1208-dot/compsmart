import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Bot, Shield, Database, Upload, Zap, Calculator, CreditCard, Clock, Settings, TrendingUp, Bell } from "lucide-react";

export const FAQSection = () => {
  const faqs = [
    // INTEGRAÇÃO DESEMPENHO + REMUNERAÇÃO
    {
      question: "Como funciona a integração entre Desempenho e Remuneração?",
      answer: "A CompSmart foi construída como um sistema único. Quando você avalia um colaborador (90°, 180°, 360°, metas), a nota automaticamente alimenta o módulo de remuneração, que sugere faixa salarial ideal, identifica distorções e permite simular ajustes. Não é integração via API — é um fluxo nativo.",
      icon: TrendingUp,
      isNew: true
    },
    {
      question: "Posso usar apenas Remuneração OU apenas Desempenho?",
      answer: "Sim, você pode usar um módulo por vez. Mas o verdadeiro valor está na integração — e você não paga nada a mais por ter os dois. É tudo incluído.",
      icon: Settings,
      isNew: true
    },
    {
      question: "A promoção de lançamento termina quando?",
      answer: "22 de fevereiro de 2026. Depois disso, novos clientes pagarão adicional pelo módulo de Desempenho. Quem assinar antes, garante incluído para sempre no mesmo preço.",
      icon: Clock,
      isNew: true
    },
    // PREÇOS E TRIAL
    {
      question: "Quanto custa o CompSmart e quais são os planos disponíveis?",
      answer: "Oferecemos 4 planos: Starter (até 50 colaboradores) a partir de R$ 199/mês, Medium (até 200 colab.) a partir de R$ 499/mês, Pro (até 500 colab.) a partir de R$ 899/mês e Enterprise (acima de 500 colab.) sob consulta. Aproveite o desconto de 30% no lançamento até 22/02/2026 e economize ainda mais com o plano anual.",
      icon: CreditCard,
      isNew: true
    },
    {
      question: "O que está incluso no período de teste grátis?",
      answer: "O teste grátis de 14 dias dá acesso completo ao plano escolhido, sem restrições de funcionalidades. Você pode cadastrar sua estrutura organizacional, colaboradores, tabela salarial e testar todos os Agentes Smart de IA. Não é necessário cartão de crédito para começar e o suporte está disponível durante todo o período.",
      icon: Clock,
      isNew: true
    },
    // NOVOS - Recursos Avançados
    {
      question: "Como funciona a simulação de dissídio coletivo?",
      answer: "Acesse Menu > Analytics > Análise Salarial > clique em 'Nova Simulação'. Escolha entre percentual fixo (todos recebem o mesmo %) ou escalonado por faixa (% diferentes por faixa salarial). O sistema calcula automaticamente o impacto: colaboradores afetados, custo mensal e anual. Salve cenários para comparação e, quando aprovado, efetive os ajustes com um clique.",
      icon: Calculator,
      isNew: true
    },
    {
      question: "Quais tipos de incentivos posso gerenciar no CompSmart?",
      answer: "ICP (Curto Prazo): PLR, PPR, Bônus por Metas, Comissões de Vendas. ILP (Longo Prazo): Stock Options, RSU (Ações Restritas), Partnership, Phantom Shares, Bônus Diferido e Previdência Corporativa com vesting/cliff configurável. Cada programa pode ter elegibilidade por grade e atribuição individual ou em lote.",
      icon: TrendingUp,
      isNew: true
    },
    {
      question: "Como funcionam os alertas automáticos do sistema?",
      answer: "O CompSmart monitora 5 tipos de situações: Pico de Consultas (uso acima do normal), Erros Recorrentes, Usuários Inativos, Uso Fora do Horário e Concentração de Uso. Configure thresholds, destinatários de email e severidade (Info/Warning/Critical). A verificação é diária e automática. Acesse em Menu > Configurações > Alertas.",
      icon: Bell,
      isNew: true
    },
    {
      question: "Qual a ordem recomendada para configurar o sistema?",
      answer: "1) Estrutura Organizacional (empresa, filiais, áreas, departamentos); 2) Cargos (com código CBO e família); 3) Tabela Salarial (faixas por grade - ative após criar); 4) Colaboradores (individual ou importação Excel); 5) Benefícios e Incentivos. Seguindo esta ordem, tudo se integra automaticamente.",
      icon: Settings,
      isNew: true
    },
    // EXISTENTES - Atualizados (removido isNew de alguns)
    {
      question: "Como funciona a avaliação de cargos por pontos?",
      answer: "O CompSmart utiliza uma metodologia de avaliação por fatores e pontos baseada nas melhores práticas de mercado. Você define fatores como Know-how, Responsabilidade e Solução de Problemas, atribui pesos e graus, e o sistema calcula automaticamente a pontuação de cada cargo para criar uma estrutura salarial consistente e defensável.",
      icon: Calculator
    },
    {
      question: "Como funcionam os Agentes Inteligentes de IA?",
      answer: "Nossos agentes são especialistas virtuais treinados em remuneração brasileira. O Jurídico Smart gera contratos e analisa compliance, o Salary Smart faz benchmarking e calcula compa-ratio, e o R&B Smart ajuda a estruturar incentivos. Todos trabalham 24/7, respondem em segundos e aprendem com o contexto da sua empresa.",
      icon: Bot
    },
    {
      question: "Meus dados estão seguros com a IA?",
      answer: "Absolutamente. Utilizamos criptografia de nível enterprise (AES-256), somos 100% LGPD compliant e seus dados nunca são usados para treinar modelos externos. A IA processa localmente e os resultados pertencem exclusivamente à sua empresa. Temos certificações de segurança e auditorias regulares.",
      icon: Shield
    },
    {
      question: "Como funciona o benchmark de mercado com IA?",
      answer: "Nosso agente de IA cruza dados de pesquisas salariais públicas e privadas, analisa tendências de mercado e compara sua estrutura salarial com empresas similares por porte, setor e região. O sistema gera recomendações automáticas para ajustes e identifica distorções salariais.",
      icon: Database
    },
    {
      question: "Como funciona a Pesquisa Salarial?",
      answer: "A Pesquisa Salarial do CompSmart compara seus cargos e salários com dados reais de mercado de mais de 500 pesquisas. Você pode importar templates prontos, participar de surveys colaborativos ou criar pesquisas customizadas. O sistema calcula automaticamente percentis, médias e recomendações de ajuste.",
      icon: Database
    },
    {
      question: "Posso importar dados de outras plataformas?",
      answer: "Sim! Oferecemos importação via Excel/CSV para colaboradores, cargos, salários e estrutura organizacional. O sistema valida os dados, identifica inconsistências e sugere correções. Também temos templates prontos para facilitar a migração de outras ferramentas de RH.",
      icon: Upload
    },
    {
      question: "É seguro armazenar dados dos colaboradores?",
      answer: "Sim. Utilizamos criptografia de nível enterprise, somos LGPD compliant e seguimos os mais altos padrões de segurança da informação. Todos os dados são armazenados em servidores seguros com backup automatizado e controle de acesso baseado em perfis.",
      icon: Shield
    },
    {
      question: "Preciso ter conhecimento em RH para usar o CompSmart?",
      answer: "Não. O sistema foi desenvolvido para ser intuitivo e guiar você passo a passo. Os agentes Smart fornecem orientações contextuais e sugestões automáticas. Além disso, oferecemos suporte humanizado e consultoria embutida para ajudar em decisões estratégicas.",
      icon: HelpCircle
    },
    {
      question: "Como o agente verifica compliance trabalhista?",
      answer: "O Assistente Jurídico Smart monitora constantemente a legislação trabalhista e previdenciária brasileira, identifica riscos em políticas de remuneração, gera alertas automáticos e fornece referências legais atualizadas. Ele também auxilia na criação de contratos e políticas em conformidade.",
      icon: Shield
    },
    {
      question: "Posso customizar os benefícios e incentivos da minha empresa?",
      answer: "Sim, totalmente. Você pode criar programas de PLR, PPR, bônus e comissões com regras personalizadas, definir elegibilidade por grade/nível, configurar matching para previdência, criar pacotes de benefícios flexíveis e muito mais. O sistema se adapta à sua política.",
      icon: Zap
    },
    {
      question: "Quais dados preciso para começar?",
      answer: "Para começar, você precisa apenas da estrutura organizacional (unidades, áreas) e lista de cargos. Os demais dados (salários, benefícios, colaboradores) podem ser importados gradualmente via planilha Excel ou cadastrados diretamente no sistema.",
      icon: Database
    },
    {
      question: "Posso fazer upgrade ou downgrade do plano a qualquer momento?",
      answer: "Sim. Você pode alterar seu plano a qualquer momento sem burocracia. O ajuste é proporcional e você só paga pela diferença. Não há custos de migração nem penalidades por cancelamento.",
      icon: Zap
    },
    {
      question: "O CompSmart integra com outros sistemas de RH?",
      answer: "Sim, no plano Enterprise oferecemos integrações customizadas via API e webhooks com sistemas de folha de pagamento, ERP e outras ferramentas de RH. Entre em contato com nossa equipe para discutir suas necessidades específicas de integração.",
      icon: Database
    }
  ];

  return (
    <section id="faq" className="py-20 bg-muted/30 dark:bg-muted/10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-primary text-white px-4 py-1.5 mb-6 text-sm">
              <HelpCircle className="h-4 w-4 mr-2" />
              Tire Suas Dúvidas
            </Badge>
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
                className="bg-background rounded-lg border border-border px-6 hover:border-primary/50 transition-colors data-[state=open]:border-primary/50"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5 group">
                  <div className="flex items-center gap-3 pr-4">
                    <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <faq.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-semibold">{faq.question}</span>
                    {faq.isNew && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0 ml-2">
                        Novo!
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5 pl-10">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Ainda tem dúvidas? Entre em contato com nossa equipe pelo email{" "}
              <a href="mailto:contato@compsmart.ia.br" className="text-primary hover:underline font-semibold">
                contato@compsmart.ia.br
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};