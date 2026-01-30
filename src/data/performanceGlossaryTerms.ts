export interface PerformanceGlossaryTerm {
  term: string;
  category: string;
  summary: string;
  fullContent: string;
  examples?: string[];
  tips?: string[];
  myths?: { myth: string; reality: string }[];
}

export const performanceGlossaryCategories = [
  { id: "avaliacao", label: "Tipos de Avaliação", icon: "ClipboardCheck" },
  { id: "desenvolvimento", label: "Desenvolvimento", icon: "TrendingUp" },
  { id: "competencias", label: "Competências", icon: "Brain" },
  { id: "ferramentas", label: "Ferramentas", icon: "LayoutGrid" },
  { id: "reconhecimento", label: "Reconhecimento", icon: "Award" },
  { id: "sucessao", label: "Sucessão", icon: "Users" },
] as const;

export const performanceGlossaryTerms: PerformanceGlossaryTerm[] = [
  // ===== TIPOS DE AVALIAÇÃO =====
  {
    term: "Avaliação 90°",
    category: "avaliacao",
    summary: "Modelo de avaliação onde apenas o gestor direto avalia o colaborador. É o formato mais simples e tradicional, focado na visão hierárquica do desempenho. Ideal para empresas menores ou em início de maturidade em gestão de pessoas.",
    fullContent: `A avaliação 90° representa o modelo mais tradicional de avaliação de desempenho, onde o fluxo é unidirecional: do gestor para o colaborador. Apesar de parecer simples, quando bem estruturada, pode ser extremamente eficaz.

**Quando usar:**
- Empresas em início de jornada de avaliação de desempenho
- Equipes pequenas (até 10 pessoas por gestor)
- Culturas organizacionais mais hierárquicas
- Quando há necessidade de decisões rápidas

**Vantagens:**
- Rapidez na execução (menos avaliadores por pessoa)
- Simplicidade de implementação e treinamento
- Menor demanda de tempo dos colaboradores
- Decisões mais ágeis sobre promoções e ajustes

**Desvantagens:**
- Visão unilateral pode gerar vieses
- Colaborador não tem voz formal no processo
- Não captura percepção de pares e subordinados`,
    examples: [
      "Uma startup com 15 funcionários que está implementando sua primeira avaliação formal",
      "Avaliação do período de experiência (90 dias) de novos colaboradores",
      "Feedback trimestral de equipes operacionais com metas claras e mensuráveis"
    ],
    tips: [
      "Combine sempre com autoavaliação informal para enriquecer a conversa",
      "Prepare o gestor com treinamento em feedback construtivo",
      "Documente as conversas para acompanhamento futuro"
    ],
    myths: [
      {
        myth: "A avaliação 90° é ultrapassada e não funciona mais",
        reality: "Ainda é muito eficaz para equipes pequenas e empresas em amadurecimento. O importante é a qualidade da conversa, não a complexidade do modelo."
      }
    ]
  },
  {
    term: "Avaliação 180°",
    category: "avaliacao",
    summary: "Combina a avaliação do gestor com a autoavaliação do colaborador. Promove diálogo e reflexão, sendo o ponto de partida ideal para empresas que querem evoluir da avaliação tradicional para um modelo mais participativo.",
    fullContent: `A avaliação 180° adiciona a perspectiva do próprio colaborador ao processo, criando uma dinâmica de diálogo entre gestor e avaliado. É considerada o primeiro passo para culturas mais abertas de feedback.

**O que inclui:**
- Autoavaliação: o colaborador reflete sobre seu próprio desempenho
- Avaliação do gestor: visão do líder direto
- Conversa de alinhamento: momento para discutir diferenças de percepção

**Por que é importante a autoavaliação:**
- Desenvolve autoconsciência e responsabilidade
- Prepara o colaborador para a conversa de feedback
- Identifica diferenças de percepção (pontos cegos)
- Engaja o colaborador no próprio desenvolvimento

**Fluxo típico:**
1. Colaborador preenche autoavaliação
2. Gestor preenche avaliação
3. Ambos se reúnem para discutir
4. Definem juntos o PDI (Plano de Desenvolvimento)`,
    examples: [
      "Colaborador se avalia como 'excepcional' em comunicação, mas gestor percebe gaps. A conversa revela que o colaborador comunica bem por escrito, mas precisa melhorar em apresentações.",
      "Gestor descobre na conversa que colaborador enfrentou desafios pessoais que impactaram entregas, ajustando a avaliação."
    ],
    tips: [
      "Peça a autoavaliação com antecedência (mínimo 5 dias úteis)",
      "Compare as notas antes da conversa para identificar gaps de percepção",
      "Use as diferenças como pauta para discussão, não como confronto",
      "Documente os acordos da conversa no PDI"
    ],
    myths: [
      {
        myth: "Colaboradores sempre se supervalorizam na autoavaliação",
        reality: "Pesquisas mostram que muitos se subestimam por insegurança. A autoavaliação revela mais sobre autoconsciência do que sobre ego."
      }
    ]
  },
  {
    term: "Avaliação 360°",
    category: "avaliacao",
    summary: "Avaliação completa que inclui gestor, pares, subordinados (se houver) e autoavaliação. Oferece uma visão holística do colaborador, capturando múltiplas perspectivas sobre comportamentos e entregas.",
    fullContent: `A avaliação 360° é considerada o modelo mais completo de avaliação, pois captura a percepção de todas as pessoas que interagem com o colaborador. É especialmente valiosa para avaliar competências comportamentais e liderança.

**Quem participa:**
- **Gestor direto**: visão de entregas e resultados
- **Pares**: visão de colaboração e trabalho em equipe
- **Subordinados** (se aplicável): visão de liderança
- **Autoavaliação**: percepção do próprio colaborador
- **Clientes internos** (opcional): visão de atendimento

**Quando é mais adequada:**
- Avaliação de líderes e gestores
- Cargos que exigem alta colaboração
- Empresas com cultura de feedback madura
- Processos de sucessão e desenvolvimento de talentos

**Cuidados importantes:**
- Garantir anonimato dos avaliadores (exceto gestor)
- Treinar avaliadores para dar feedback construtivo
- Ter no mínimo 3 pares para garantir anonimato
- Calibrar expectativas sobre o processo`,
    examples: [
      "Um gerente é avaliado pelo diretor, por 4 pares de outras áreas, por 6 subordinados diretos e faz autoavaliação. O resultado mostra que ele é excepcional em entregas, mas precisa melhorar escuta ativa.",
      "Analista sênior que atende múltiplas áreas recebe feedback de 5 clientes internos, revelando que é ótimo tecnicamente mas precisa ser mais didático."
    ],
    tips: [
      "Reserve tempo adequado para consolidar e analisar os resultados",
      "Foque em padrões (feedbacks recorrentes), não em comentários isolados",
      "Use para desenvolvimento, não apenas para decisões de promoção",
      "Faça calibração para garantir equidade entre avaliados"
    ],
    myths: [
      {
        myth: "A avaliação 360° vira 'caça às bruxas' e gera conflitos",
        reality: "Quando bem conduzida, com anonimato e foco em desenvolvimento, é a forma mais justa de avaliação. Conflitos surgem de processos mal implementados, não do modelo em si."
      },
      {
        myth: "Todos precisam de avaliação 360°",
        reality: "É mais indicada para cargos de liderança e alta colaboração. Para cargos operacionais com escopo definido, 90° ou 180° podem ser mais eficazes."
      }
    ]
  },
  {
    term: "Avaliação de Desempenho",
    category: "avaliacao",
    summary: "Processo formal e estruturado de mensuração do desempenho que alinha expectativas, identifica gaps e direciona desenvolvimento. É a base para meritocracia, decisões de carreira e gestão de talentos.",
    fullContent: `A avaliação de desempenho é muito mais do que um formulário a ser preenchido anualmente. É um processo contínuo que conecta estratégia da empresa, expectativas do cargo e desenvolvimento individual.

**Componentes principais:**
1. **Definição de expectativas**: o que esperamos do colaborador
2. **Acompanhamento contínuo**: feedback e check-ins ao longo do período
3. **Avaliação formal**: mensuração ao final do ciclo
4. **Desenvolvimento**: PDI baseado nos gaps identificados

**Por que é fundamental:**
- **Para a empresa**: alinha comportamentos à estratégia, identifica talentos, embasa decisões de mérito
- **Para o gestor**: ferramenta de gestão de equipe, documentação de performance
- **Para o colaborador**: clareza de expectativas, direcionamento de carreira, reconhecimento justo

**O que NÃO é avaliação de desempenho:**
- Instrumento de punição ou demissão
- Formalidade burocrática sem aplicação prática
- Momento único no ano para dar feedback
- Ferramenta apenas do RH`,
    examples: [
      "Empresa define no início do ano as metas e competências esperadas. Ao longo do ano, gestores fazem check-ins mensais. No final, avaliam formalmente e definem PDI para o próximo ciclo.",
      "Colaborador recebe nota 'abaixo do esperado' em uma competência. Em vez de punição, recebe PDI estruturado com treinamento e acompanhamento para desenvolvimento."
    ],
    tips: [
      "Comece definindo expectativas claras no início do ciclo",
      "Não deixe para dar feedback apenas na avaliação formal",
      "Use a avaliação como input para decisões, mas não como única fonte",
      "Capacite gestores para conduzir conversas de desenvolvimento"
    ],
    myths: [
      {
        myth: "Avaliação de desempenho serve para justificar demissões",
        reality: "O propósito principal é desenvolver pessoas. Demissões devem ser exceção, não regra, e baseadas em múltiplos fatores além da avaliação."
      },
      {
        myth: "É uma burocracia que não traz resultados",
        reality: "Processos bem implementados aumentam engajamento, retenção e produtividade. O problema está em processos mal desenhados, não no conceito."
      }
    ]
  },
  {
    term: "Calibração",
    category: "avaliacao",
    summary: "Reunião entre gestores para alinhar critérios de avaliação e garantir equidade. Evita que um gestor seja muito rigoroso enquanto outro é muito leniente, assegurando que as notas reflitam padrões consistentes.",
    fullContent: `A calibração é uma etapa crítica do processo de avaliação que muitas empresas negligenciam. Sem ela, as notas dependem mais do gestor do que do desempenho real do colaborador.

**Por que é necessária:**
- Diferentes gestores têm diferentes réguas de avaliação
- Sem alinhamento, mesmas performances recebem notas diferentes
- Afeta diretamente decisões de mérito, bônus e promoção
- Garante percepção de justiça pelos colaboradores

**Como funciona:**
1. Gestores preenchem avaliações individualmente
2. Reunião de calibração com gestores de mesmo nível
3. Discussão de casos extremos (notas muito altas ou muito baixas)
4. Ajuste de notas baseado em evidências e critérios comuns
5. Documentação das decisões

**Formatos comuns:**
- **Por área**: gestores da mesma diretoria
- **Por nível**: todos os gerentes, todos os analistas seniores
- **Por grade**: colaboradores de mesma faixa salarial`,
    examples: [
      "João foi avaliado como 'excepcional' por Maria, enquanto Pedro, com desempenho similar, foi avaliado como 'bom' por Carlos. Na calibração, alinham-se os critérios e ajustam-se as notas.",
      "Gestor novo tende a dar notas mais altas por medo de desmotivar. Na calibração, pares ajudam a calibrar expectativas."
    ],
    tips: [
      "Defina critérios claros ANTES das avaliações individuais",
      "Peça exemplos e evidências para notas extremas",
      "Mantenha foco em comportamentos observáveis, não em personalidade",
      "Documente as discussões para referência futura"
    ],
    myths: [
      {
        myth: "Calibração serve para 'derrubar' notas e economizar em bônus",
        reality: "O objetivo é garantir equidade, o que pode significar tanto reduzir quanto aumentar notas. Empresas sérias usam para justiça, não economia."
      }
    ]
  },
  {
    term: "Performance Review",
    category: "avaliacao",
    summary: "Processo formal de análise e discussão do desempenho em um período definido. Pode ser trimestral, semestral ou anual, dependendo da cultura e maturidade da empresa.",
    fullContent: `O Performance Review é o momento formal de consolidação e discussão do desempenho. Diferente do feedback contínuo, é uma pausa estruturada para reflexão e planejamento.

**Elementos de um bom Performance Review:**
1. **Preparação**: ambas as partes revisam período, metas e feedbacks anteriores
2. **Avaliação estruturada**: preenchimento de formulário com critérios definidos
3. **Conversa de qualidade**: discussão focada em desenvolvimento
4. **Plano de ação**: definição de próximos passos (PDI)
5. **Documentação**: registro para acompanhamento

**Frequências comuns:**
- **Anual**: tradicional, mas pode ser muito espaçado
- **Semestral**: balanço no meio e fim do ano
- **Trimestral**: ideal para ambientes dinâmicos
- **Contínuo com checkpoints formais**: tendência moderna

**O que discutir:**
- Resultados vs. metas estabelecidas
- Demonstração de competências esperadas
- Feedbacks recebidos no período
- Aspirações de carreira
- Próximos passos de desenvolvimento`,
    examples: [
      "Empresa faz review trimestral focado em metas e review semestral focado em competências e desenvolvimento de carreira.",
      "Review anual inclui: autoavaliação, avaliação 360°, calibração, conversa 1:1 e definição de PDI."
    ],
    tips: [
      "Agende com antecedência e proteja o tempo da conversa",
      "Prepare-se revisando notas de check-ins anteriores",
      "Equilibre reconhecimento de conquistas com áreas de melhoria",
      "Termine com próximos passos claros e acordados"
    ]
  },

  // ===== DESENVOLVIMENTO =====
  {
    term: "Feedback",
    category: "desenvolvimento",
    summary: "Retorno sobre desempenho, comportamento ou resultado de uma ação. Quando bem feito, é a ferramenta mais poderosa de desenvolvimento profissional. Pode ser positivo (reforço) ou construtivo (melhoria).",
    fullContent: `Feedback é a base do desenvolvimento profissional. Sem ele, pessoas operam no escuro, sem saber se estão no caminho certo ou o que precisam ajustar. É uma habilidade que pode ser aprendida e aprimorada.

**Tipos de feedback:**
- **Positivo/Reforço**: reconhece comportamentos que devem continuar
- **Construtivo/Desenvolvimento**: aponta melhorias necessárias
- **Corretivo**: aborda problemas que precisam cessar imediatamente

**Técnica SBI (Situação-Comportamento-Impacto):**
1. **Situação**: "Na reunião de ontem com o cliente..."
2. **Comportamento**: "...quando você interrompeu o diretor..."
3. **Impacto**: "...ele ficou desconfortável e perdemos a linha de raciocínio."

**Quando dar feedback:**
- O mais próximo possível do evento
- Em ambiente adequado (privado para construtivo)
- Quando você estiver emocionalmente equilibrado
- Com tempo suficiente para conversa completa`,
    examples: [
      "Positivo: 'Na apresentação para a diretoria, você estruturou os dados de forma muito clara. Isso facilitou a tomada de decisão e gerou credibilidade para nossa área.'",
      "Construtivo: 'Notei que nas últimas 3 reuniões você chegou 10 minutos atrasado. Isso passa impressão de desorganização e atrapalha o início das discussões. O que está acontecendo?'"
    ],
    tips: [
      "Feedback construtivo: foque em comportamento, não em personalidade",
      "Comece pedindo a percepção da pessoa antes de dar sua visão",
      "Equilibre positivo e construtivo (não só critique)",
      "Pergunte como você pode ajudar no desenvolvimento"
    ],
    myths: [
      {
        myth: "Feedback negativo desmotiva as pessoas",
        reality: "Feedback construtivo, bem dado, motiva e desenvolve. O que desmotiva é a ausência de feedback ou feedback mal dado (agressivo, vago, tardio)."
      },
      {
        myth: "Algumas pessoas 'não aceitam' feedback",
        reality: "A forma como o feedback é dado influencia muito a receptividade. Pratique a técnica e ajuste ao perfil de cada pessoa."
      }
    ]
  },
  {
    term: "Feedback Contínuo",
    category: "desenvolvimento",
    summary: "Prática de dar feedback em tempo real, no momento em que o comportamento ocorre. Muito mais eficaz do que esperar a avaliação anual, pois permite correções imediatas e reforço de comportamentos positivos.",
    fullContent: `O feedback contínuo representa uma mudança cultural importante: sair do modelo de avaliação anual para uma gestão de performance em tempo real.

**Por que é mais eficaz:**
- Comportamentos são lembrados com clareza
- Correções podem ser feitas imediatamente
- Reconhecimento oportuno tem mais impacto
- Reduz ansiedade da avaliação formal
- Desenvolve cultura de abertura

**Como implementar:**
1. **Rituais regulares**: check-ins semanais ou quinzenais
2. **Ferramenta de registro**: documentar feedbacks dados
3. **Treinamento de gestores**: habilidade de dar feedback informal
4. **Kudos entre pares**: reconhecimento horizontal
5. **Canal de feedback**: espaço para pedir e receber

**Diferença para avaliação formal:**
O feedback contínuo não substitui a avaliação formal, mas a complementa. A avaliação formal consolida os feedbacks do período e permite visão de evolução.`,
    examples: [
      "Após apresentação bem-sucedida, gestor envia mensagem: 'Parabéns pela apresentação! Sua preparação ficou evidente. Continue assim.'",
      "No mesmo dia de uma reunião difícil, gestor conversa: 'Notei que você ficou defensivo quando questionaram os números. Vamos preparar melhor a argumentação juntos?'"
    ],
    tips: [
      "Reserve 5 minutos após eventos importantes para dar feedback",
      "Use ferramentas para registrar e não esquecer",
      "Celebre pequenas vitórias, não apenas grandes conquistas",
      "Peça feedback também, dê o exemplo"
    ]
  },
  {
    term: "Gap de Competência",
    category: "desenvolvimento",
    summary: "Diferença entre o nível esperado e o nível atual de uma competência. Identificar gaps é o primeiro passo para desenvolvimento direcionado e eficaz.",
    fullContent: `O gap de competência é a distância entre onde o colaborador está e onde deveria estar em determinada habilidade. É o ponto de partida para qualquer PDI efetivo.

**Como identificar gaps:**
1. **Definir expectativas**: qual nível é esperado para o cargo
2. **Avaliar nível atual**: através de avaliação de desempenho
3. **Calcular diferença**: gap = esperado - atual
4. **Priorizar**: nem todo gap precisa ser desenvolvido

**Tipos de gaps:**
- **Técnicos**: habilidades específicas do cargo
- **Comportamentais**: soft skills e competências interpessoais
- **Conhecimento**: falta de informação ou formação
- **Experiência**: falta de vivência prática

**O que fazer com gaps identificados:**
- **Gap pequeno (1 nível)**: desenvolvimento no próprio trabalho
- **Gap médio (2 níveis)**: treinamento + prática
- **Gap grande (3+ níveis)**: reavaliação de fit para o cargo`,
    examples: [
      "Cargo exige 'Negociação nível 4'. Colaborador está no 'nível 2'. Gap = 2 níveis. PDI: curso de negociação + participação em 5 negociações acompanhado.",
      "Analista promovido a coordenador tem gap em 'Gestão de Pessoas'. PDI: mentoria com gestor experiente + curso de liderança."
    ],
    tips: [
      "Foque em 2-3 gaps por vez, não em todos simultaneamente",
      "Priorize gaps que mais impactam a entrega atual",
      "Combine teoria (cursos) com prática (projetos)",
      "Estabeleça prazo realista para fechamento do gap"
    ]
  },
  {
    term: "PDI - Plano de Desenvolvimento Individual",
    category: "desenvolvimento",
    summary: "Documento que registra ações concretas para desenvolver competências. Deve ser SMART (específico, mensurável, atingível, relevante e temporal) e ter acompanhamento periódico.",
    fullContent: `O PDI é o instrumento que transforma gaps identificados em ações concretas de desenvolvimento. Sem ele, a avaliação de desempenho é apenas diagnóstico sem tratamento.

**Estrutura de um bom PDI:**
1. **Gap identificado**: competência a desenvolver
2. **Situação atual**: onde o colaborador está
3. **Objetivo**: onde precisa chegar
4. **Ações de desenvolvimento**: o que fazer para chegar lá
5. **Prazo**: quando cada ação será realizada
6. **Indicadores**: como saber se funcionou
7. **Recursos**: o que é necessário (tempo, dinheiro, apoio)

**Tipos de ações de desenvolvimento:**
- **70% Experiência**: projetos, desafios, job rotation
- **20% Exposição**: mentoria, coaching, shadowing
- **10% Educação**: cursos, leituras, certificações

**Responsabilidades:**
- **Colaborador**: protagonista do próprio desenvolvimento
- **Gestor**: facilitador, provedor de oportunidades
- **RH**: estrutura, ferramentas, acompanhamento`,
    examples: [
      "Gap: Comunicação. Objetivo: melhorar apresentações. Ações: (1) curso de oratória - 30 dias; (2) apresentar em 3 reuniões de área - 60 dias; (3) apresentar para diretoria - 90 dias. Indicador: feedback de clareza >4 na próxima avaliação.",
      "Gap: Liderança. Ações: (1) mentoria mensal com diretor - 6 meses; (2) liderar projeto piloto - 3 meses; (3) feedback dos liderados - contínuo."
    ],
    tips: [
      "Menos é mais: foque em 2-3 gaps prioritários",
      "Prefira ações práticas (70%) sobre cursos (10%)",
      "Agende check-ins mensais para acompanhar progresso",
      "Documente aprendizados e evidências de evolução"
    ]
  },
  {
    term: "Autoavaliação",
    category: "desenvolvimento",
    summary: "Processo em que o colaborador reflete sobre seu próprio desempenho. Desenvolve autoconsciência, prepara para a conversa com o gestor e revela diferenças de percepção importantes.",
    fullContent: `A autoavaliação é um exercício poderoso de reflexão que vai além de simplesmente preencher um formulário. Quando bem feita, desenvolve autoconsciência e responsabilidade pelo próprio desenvolvimento.

**Benefícios:**
- **Autoconsciência**: entender pontos fortes e áreas de melhoria
- **Preparação**: chegar na conversa de feedback preparado
- **Protagonismo**: assumir responsabilidade pelo desenvolvimento
- **Revelação de gaps**: identificar diferenças de percepção

**O que refletir:**
- Conquistas e entregas do período
- Desafios enfrentados e como foram superados
- Competências demonstradas e gaps percebidos
- Feedbacks recebidos e como foram aplicados
- Aspirações de carreira e próximos passos

**Armadilhas comuns:**
- **Síndrome do impostor**: se subestimar por insegurança
- **Excesso de confiança**: não reconhecer áreas de melhoria
- **Foco em atividades**: listar tarefas em vez de resultados
- **Vagueza**: não dar exemplos concretos`,
    examples: [
      "Colaborador identifica na autoavaliação que é forte em análise técnica, mas precisa melhorar comunicação. Essa percepção coincide com feedback do gestor.",
      "Autoavaliação revela que colaborador se considera 'excelente' em trabalho em equipe, mas feedbacks de pares indicam oportunidade de melhoria. Gap de percepção a explorar."
    ],
    tips: [
      "Reserve tempo de qualidade para reflexão (mínimo 1 hora)",
      "Revise suas metas e feedbacks do período antes de avaliar",
      "Dê exemplos concretos para cada avaliação",
      "Seja honesto: nem modesto demais, nem confiante demais"
    ]
  },
  {
    term: "Check-in / One-on-One",
    category: "desenvolvimento",
    summary: "Reuniões periódicas (geralmente semanais ou quinzenais) entre gestor e colaborador para alinhamento, feedback e suporte. Não é para cobrar tarefas, é para desenvolver pessoas.",
    fullContent: `O One-on-One (1:1) é considerado uma das práticas mais importantes de gestão de pessoas. É o espaço dedicado para o colaborador, onde ele é protagonista da conversa.

**Propósito:**
- Dar e receber feedback contínuo
- Remover bloqueios e obstáculos
- Discutir desenvolvimento de carreira
- Fortalecer relação gestor-colaborador
- Antecipar problemas antes que escalem

**O que NÃO é:**
- Reunião de status de projetos
- Momento de cobrar entregas
- Oportunidade para o gestor falar
- Encontro para resolver urgências

**Estrutura sugerida (30-60 min):**
1. **Abertura (5 min)**: como você está? algo importante aconteceu?
2. **Pauta do colaborador (15 min)**: o que ele quer discutir
3. **Feedback (10 min)**: reconhecimento e desenvolvimento
4. **Desenvolvimento (10 min)**: carreira, PDI, aspirações
5. **Fechamento (5 min)**: próximos passos e acordos`,
    examples: [
      "Colaborador traz preocupação sobre deadline de projeto. Gestor ajuda a priorizar e oferece suporte para negociar prazo.",
      "One-on-One revela que colaborador está desmotivado por falta de desafio. Gestor propõe participação em projeto estratégico."
    ],
    tips: [
      "Nunca cancele 1:1 - remarque se necessário",
      "Deixe o colaborador trazer a pauta principal",
      "Tome notas para acompanhamento",
      "Faça perguntas abertas: 'Como posso te ajudar?'"
    ],
    myths: [
      {
        myth: "One-on-One é perda de tempo, prefiro reuniões de equipe",
        reality: "Reuniões de equipe não substituem o espaço individual. Muitas conversas importantes só acontecem no 1:1."
      }
    ]
  },
  {
    term: "Ciclo de Desempenho",
    category: "desenvolvimento",
    summary: "Período definido para avaliação de desempenho (trimestral, semestral, anual). Define quando metas são estabelecidas, acompanhadas e avaliadas formalmente.",
    fullContent: `O ciclo de desempenho é o ritmo que organiza todo o processo de gestão de performance. Definir o ciclo certo depende da cultura, maturidade e dinâmica do negócio.

**Ciclos comuns:**
- **Anual**: tradicional, alinhado ao ano fiscal
- **Semestral**: balanço no meio do ano, revisão de metas
- **Trimestral**: mais ágil, ideal para ambientes dinâmicos
- **Contínuo**: metas e avaliações flexíveis

**Etapas típicas de um ciclo:**
1. **Planejamento**: definição de metas e expectativas
2. **Execução**: trabalho, acompanhamento, feedback contínuo
3. **Avaliação**: mensuração formal do desempenho
4. **Calibração**: alinhamento entre gestores
5. **Feedback formal**: conversa e definição de PDI
6. **Decisões**: mérito, promoções, bônus

**Tendências:**
- Ciclos mais curtos para maior agilidade
- Separação de ciclo de metas (trimestral) e competências (anual)
- Feedback contínuo complementando avaliação formal`,
    examples: [
      "Empresa faz ciclo anual de competências (janeiro a dezembro) com checkpoints trimestrais de metas.",
      "Startup usa ciclo trimestral alinhado aos OKRs, com avaliação de competências semestral."
    ],
    tips: [
      "Alinhe o ciclo ao planejamento estratégico da empresa",
      "Comunique claramente as datas e expectativas",
      "Mantenha consistência: evite mudar o ciclo frequentemente",
      "Avalie se o ciclo atual está gerando os resultados esperados"
    ]
  },

  // ===== COMPETÊNCIAS =====
  {
    term: "Competência Técnica (Hard Skill)",
    category: "competencias",
    summary: "Habilidades e conhecimentos específicos para executar tarefas. São mensuráveis, podem ser aprendidas em cursos, treinamentos e prática. Representam o 'saber fazer' do cargo.",
    fullContent: `Hard skills são as competências técnicas e conhecimentos específicos necessários para executar as atividades de um cargo. São geralmente mais fáceis de avaliar e desenvolver do que soft skills.

**Características:**
- **Mensuráveis**: podem ser testadas e certificadas
- **Ensináveis**: aprendidas em cursos e treinamentos
- **Específicas**: variam por cargo e área
- **Evolutivas**: precisam de atualização constante

**Categorias comuns:**
- **Técnicas**: programação, contabilidade, engenharia
- **Ferramentas**: Excel, SAP, Salesforce
- **Idiomas**: inglês, espanhol, mandarim
- **Certificações**: PMP, CPA, AWS
- **Conhecimento setorial**: regulamentações, normas

**Como desenvolver:**
- Cursos presenciais e online
- Certificações formais
- Prática supervisionada
- Projetos desafiadores
- Mentoria técnica`,
    examples: [
      "Analista financeiro: Excel avançado, modelagem financeira, conhecimento de IFRS",
      "Desenvolvedor: Python, SQL, arquitetura de microsserviços, metodologias ágeis",
      "Vendedor: CRM Salesforce, técnicas de negociação, conhecimento do produto"
    ],
    tips: [
      "Mapeie as hard skills críticas para cada cargo",
      "Mantenha atualizado o inventário de certificações da equipe",
      "Combine teoria (cursos) com prática (projetos)",
      "Avalie hard skills com testes práticos, não apenas diplomas"
    ]
  },
  {
    term: "Competência Comportamental (Soft Skill)",
    category: "competencias",
    summary: "Habilidades interpessoais e comportamentais. São mais difíceis de medir e desenvolver, mas cada vez mais valorizadas. Representam o 'como fazer' e interagir com outros.",
    fullContent: `Soft skills são as competências comportamentais e interpessoais que determinam como uma pessoa se relaciona, comunica e se comporta no ambiente de trabalho. São consideradas grandes diferenciais de carreira.

**Por que são cada vez mais importantes:**
- Hard skills podem ser automatizadas, soft skills não
- Determinam sucesso em cargos de liderança
- Impactam clima, cultura e colaboração
- São transferíveis entre cargos e empresas

**Soft skills mais valorizadas:**
- **Comunicação**: oral, escrita, escuta ativa
- **Liderança**: influência, desenvolvimento de pessoas
- **Colaboração**: trabalho em equipe, construção de relacionamentos
- **Adaptabilidade**: flexibilidade, resiliência, aprendizado contínuo
- **Inteligência emocional**: autoconhecimento, empatia, gestão de emoções
- **Resolução de problemas**: pensamento crítico, criatividade

**Como desenvolver (mais desafiador):**
- Feedback contínuo e coaching
- Mentoria com profissionais exemplares
- Experiências desafiadoras (stretch assignments)
- Reflexão e autoconhecimento
- Prática deliberada com acompanhamento`,
    examples: [
      "Comunicação: apresentar para diretoria, facilitar reuniões, escrever e-mails claros",
      "Liderança: motivar equipe em crise, dar feedback difícil, desenvolver talentos",
      "Colaboração: negociar com área parceira, construir consenso, gerenciar conflitos"
    ],
    tips: [
      "Soft skills se desenvolvem com prática e feedback, não apenas cursos",
      "Peça feedback específico sobre comportamentos observáveis",
      "Identifique 'modelos' de comportamento para inspiração",
      "Seja paciente: desenvolvimento de soft skills leva tempo"
    ],
    myths: [
      {
        myth: "Soft skills são características de personalidade e não mudam",
        reality: "Soft skills podem ser desenvolvidas com prática, feedback e consciência. A personalidade influencia, mas não determina."
      }
    ]
  },

  // ===== FERRAMENTAS =====
  {
    term: "Matriz 9Box",
    category: "ferramentas",
    summary: "Ferramenta de análise que cruza Desempenho (eixo X) e Potencial (eixo Y) em uma grade 3x3. Ajuda a identificar talentos, backups para sucessão e colaboradores que precisam de atenção especial.",
    fullContent: `A Matriz 9Box é uma das ferramentas mais utilizadas em gestão de talentos. Permite visualizar rapidamente onde cada colaborador está em termos de entrega atual (desempenho) e capacidade futura (potencial).

**Os 9 quadrantes:**

| Potencial Alto    | 7. Diamante Bruto | 8. Alto Potencial | 9. Estrela |
| Potencial Médio   | 4. Questionável   | 5. Profissional   | 6. Alto Desempenho |
| Potencial Baixo   | 1. Insuficiente   | 2. Eficaz         | 3. Especialista |
|                   | Baixo             | Médio             | Alto |
|                   |          DESEMPENHO                        |

**Quadrantes-chave:**
- **9 - Estrela**: reter a qualquer custo, sucessores naturais
- **7 - Diamante Bruto**: investir em desenvolvimento urgente
- **3 - Especialista**: contribuidor individual valioso
- **1 - Insuficiente**: plano de recuperação ou desligamento

**Como usar:**
1. Avaliar desempenho (entrega do último ciclo)
2. Avaliar potencial (capacidade de crescer)
3. Posicionar cada colaborador na matriz
4. Calibrar em grupo de gestores
5. Definir ações por quadrante`,
    examples: [
      "Analista com alto desempenho mas baixo potencial (quadrante 3): valorizar como especialista técnico, não forçar para gestão.",
      "Coordenador com baixo desempenho mas alto potencial (quadrante 7): investigar causas, pode estar em cargo errado ou sem suporte adequado."
    ],
    tips: [
      "Potencial não é o mesmo que desempenho - são dimensões diferentes",
      "Faça calibração em grupo para evitar vieses individuais",
      "Revise a matriz periodicamente, pessoas mudam de quadrante",
      "Use para planejar sucessão, não apenas para demissão"
    ],
    myths: [
      {
        myth: "Quem está no quadrante 1 deve ser demitido imediatamente",
        reality: "Primeiro investigue as causas. Pode ser problema de fit, gestor, ou momento pessoal. Demissão é última opção após tentativas de recuperação."
      }
    ]
  },
  {
    term: "Meta SMART",
    category: "ferramentas",
    summary: "Metodologia para criar metas claras: Específica, Mensurável, Atingível, Relevante e Temporal. Metas mal definidas são a maior causa de frustração e conflitos em avaliação de desempenho.",
    fullContent: `SMART é um acrônimo que guia a definição de metas de qualidade. Metas vagas como 'melhorar vendas' geram conflitos porque cada pessoa interpreta diferente.

**Os 5 critérios:**
- **S - Específica**: clara e detalhada, sem ambiguidade
- **M - Mensurável**: com indicador numérico ou evidência observável
- **A - Atingível**: desafiadora mas possível com os recursos disponíveis
- **R - Relevante**: alinhada à estratégia da empresa e do cargo
- **T - Temporal**: com prazo definido

**Meta ruim vs. Meta SMART:**
❌ "Melhorar atendimento ao cliente"
✅ "Aumentar NPS de 45 para 60 pontos até dezembro/2024, através de treinamento da equipe e redução do tempo de resposta"

❌ "Reduzir custos"
✅ "Reduzir custos operacionais em 15% até junho/2024, renegociando contratos de fornecedores e automatizando processos manuais"

**Erros comuns:**
- Metas genéricas demais (não específicas)
- Metas sem número (não mensuráveis)
- Metas impossíveis (não atingíveis)
- Metas que não fazem sentido para o cargo (não relevantes)
- Metas sem prazo (não temporais)`,
    examples: [
      "Vendas: 'Atingir R$ 500k em vendas no Q3, com ticket médio de R$ 50k e taxa de conversão de 30%'",
      "RH: 'Reduzir turnover voluntário de 25% para 15% até dezembro, implementando programa de retenção'",
      "TI: 'Lançar nova versão do app até outubro com uptime de 99.9% e zero bugs críticos'"
    ],
    tips: [
      "Teste cada meta contra os 5 critérios SMART",
      "Envolva o colaborador na definição da meta",
      "Defina checkpoints intermediários para metas longas",
      "Documente critérios de sucesso antes, não depois"
    ]
  },
  {
    term: "OKR (Objectives and Key Results)",
    category: "ferramentas",
    summary: "Metodologia de gestão de metas que define Objetivos ambiciosos e Resultados-Chave mensuráveis. Popularizada pelo Google, foca em alinhamento estratégico e transparência organizacional.",
    fullContent: `OKR é uma metodologia de definição de metas que se diferencia pelo foco em ambição e transparência. Diferente de metas tradicionais, OKRs são públicos e desafiadores por natureza.

**Estrutura:**
- **Objetivo (O)**: o que queremos alcançar (qualitativo, inspirador)
- **Key Results (KR)**: como saberemos que alcançamos (quantitativos, mensuráveis)

**Princípios:**
- **Ambição**: OKRs devem ser desafiadores (atingir 70% já é sucesso)
- **Transparência**: todos veem os OKRs de todos
- **Ciclos curtos**: geralmente trimestrais
- **Desvinculação de bônus**: OKRs não devem definir remuneração diretamente

**Exemplo de OKR:**
**Objetivo**: Ser referência em experiência do cliente
- KR1: Aumentar NPS de 45 para 70
- KR2: Reduzir tempo de resposta de 4h para 1h
- KR3: Atingir 90% de resolução no primeiro contato

**Diferença para metas tradicionais:**
- Metas tradicionais: 100% é esperado, abaixo é falha
- OKRs: 70% é sucesso, 100% significa que não foi ambicioso o suficiente`,
    examples: [
      "OKR de empresa: Dobrar receita mantendo margem. KRs: (1) R$ 10M em vendas; (2) 100 novos clientes; (3) margem EBITDA > 20%",
      "OKR de equipe: Lançar produto X. KRs: (1) 1000 usuários ativos; (2) 4.5 estrelas de avaliação; (3) 0 bugs críticos"
    ],
    tips: [
      "Comece com poucos OKRs (3-5 objetivos com 3-5 KRs cada)",
      "Faça check-ins semanais de progresso",
      "Não use OKRs para definir bônus diretamente",
      "Aceite que não atingir 100% é normal e esperado"
    ]
  },

  // ===== RECONHECIMENTO =====
  {
    term: "Kudos",
    category: "reconhecimento",
    summary: "Ferramenta de reconhecimento contínuo que valoriza o trabalho bem feito e fortalece relações. A palavra vem do grego 'κῦδος' (kŷdos), que significa 'glória', 'fama' ou 'renome'. Diferente da avaliação anual, o Kudos é instantâneo, reconhecendo comportamentos no momento em que ocorrem.",
    fullContent: `**Origem da palavra Kudos:**
A palavra "Kudos" tem origem no grego antigo **κῦδος (kŷdos)**, que significa "glória", "fama" ou "renome". Na Grécia Antiga, era usada para descrever a honra e o prestígio conquistados por heróis em batalhas ou competições. O termo foi adotado pelo inglês britânico no século XIX, inicialmente em contextos acadêmicos, e posteriormente popularizado nos Estados Unidos.

Curiosidade: Embora "kudos" seja uma palavra singular em grego (não existe "kudo" no original), o uso moderno criou a forma "kudo" como se fosse o singular de "kudos". No ambiente corporativo, "dar um kudo" ou "enviar kudos" tornou-se sinônimo de reconhecer publicamente o bom trabalho de alguém.

**O que é Kudos no contexto organizacional:**
Kudos é uma prática de reconhecimento peer-to-peer (entre pares) que complementa o reconhecimento formal do gestor. Cria uma cultura de valorização e gratidão no ambiente de trabalho.

**Por que Kudos funciona:**
- **Combate desengajamento**: supre necessidade básica de reconhecimento
- **É imediato**: valoriza no momento do comportamento
- **É horizontal**: não depende apenas do gestor
- **Reforça valores**: evidencia comportamentos alinhados à cultura
- **Cria conexões**: fortalece relações entre equipes

**Tipos de Kudos:**
- **Agradecimento**: por ajuda ou colaboração
- **Reconhecimento**: por entrega ou resultado
- **Celebração**: por conquista ou marco
- **Inspiração**: por atitude ou comportamento exemplar

**Como implementar:**
1. Ferramenta simples para enviar kudos
2. Categorias alinhadas aos valores da empresa
3. Visibilidade pública (mural, canal, reunião)
4. Estímulo da liderança (dar o exemplo)
5. Opcional: programa de pontos/recompensas`,
    examples: [
      "'Obrigado, Maria, por ficar até tarde ajudando no relatório. Seu espírito de equipe fez diferença!' - Valores: Colaboração",
      "'Parabéns, João, pela coragem de trazer um problema antes que virasse crise. Isso é ownership!' - Valores: Responsabilidade",
      "'Carla, sua apresentação para o cliente foi impecável. Você representou nossa equipe com excelência!' - Valores: Excelência"
    ],
    tips: [
      "Seja específico: diga exatamente o que a pessoa fez",
      "Conecte ao impacto: explique por que fez diferença",
      "Seja oportuno: não deixe passar muito tempo",
      "Faça público quando possível: amplifica o reconhecimento"
    ]
  },
  {
    term: "Cultura de Feedback",
    category: "reconhecimento",
    summary: "Ambiente organizacional onde feedback é natural, frequente e bem recebido. É construída com prática, exemplo da liderança e segurança psicológica para dar e receber retornos.",
    fullContent: `Cultura de feedback não acontece por decreto. É construída ao longo do tempo através de práticas, exemplos e ambiente seguro para conversas honestas.

**Pilares de uma cultura de feedback:**
1. **Segurança psicológica**: pessoas não têm medo de falar
2. **Exemplo da liderança**: gestores pedem e dão feedback
3. **Frequência**: feedback é contínuo, não anual
4. **Qualidade**: feedback é construtivo, específico, respeitoso
5. **Ação**: feedback gera mudança, não é ignorado

**Sinais de cultura fraca de feedback:**
- Feedbacks só na avaliação anual
- Medo de dar feedback ao gestor
- Feedbacks vagos ou agressivos
- Retaliação por feedback honesto
- "Rádio corredor" substitui conversas diretas

**Como construir:**
- Líderes pedirem feedback publicamente
- Treinar todos em dar/receber feedback
- Criar rituais regulares (1:1, retrospectivas)
- Celebrar exemplos de feedback construtivo
- Agir sobre feedbacks recebidos`,
    examples: [
      "CEO pede feedback da equipe em reunião geral e agradece publicamente: 'Obrigado por apontar isso, vou trabalhar nisso.'",
      "Empresa cria 'Feedback Friday': momento semanal para troca de feedbacks entre pares.",
      "Gestor implementa retrospectiva quinzenal onde equipe discute abertamente o que funcionou e o que melhorar."
    ],
    tips: [
      "Comece pedindo feedback antes de dar",
      "Agradeça sempre, mesmo feedback difícil de ouvir",
      "Aja sobre feedbacks recebidos e comunique as mudanças",
      "Treine a equipe na técnica SBI (Situação-Comportamento-Impacto)"
    ]
  },

  // ===== SUCESSÃO =====
  {
    term: "Potencial",
    category: "sucessao",
    summary: "Capacidade de assumir responsabilidades maiores ou diferentes no futuro. Diferente de desempenho (que olha para o passado), potencial olha para o futuro e indica capacidade de crescimento.",
    fullContent: `Potencial é uma das dimensões mais difíceis de avaliar em gestão de pessoas. Enquanto desempenho se mede por entregas passadas, potencial tenta prever capacidade futura.

**O que indica alto potencial:**
- **Capacidade de aprendizado**: aprende rápido coisas novas
- **Ambição saudável**: quer crescer e se desenvolver
- **Engajamento**: comprometido com a empresa
- **Liderança**: influencia positivamente os outros
- **Resiliência**: lida bem com pressão e mudanças
- **Visão estratégica**: enxerga além do próprio cargo

**Como avaliar potencial:**
- Observação de comportamentos ao longo do tempo
- Avaliação de competências de liderança
- Performance em projetos desafiadores
- Velocidade de aprendizado em novas situações
- Assessment formal (quando disponível)

**Potencial vs. Desempenho:**
- Alto desempenho ≠ alto potencial (são independentes)
- Especialista técnico pode ter baixo potencial gerencial
- Pessoa com alto potencial pode estar em cargo errado`,
    examples: [
      "Analista entrega bem (alto desempenho) mas não demonstra interesse em liderar ou crescer além do cargo atual (baixo potencial de crescimento vertical).",
      "Coordenador com desempenho médio demonstra visão estratégica e capacidade de influência surpreendentes (alto potencial para cargos maiores)."
    ],
    tips: [
      "Não confunda desempenho atual com potencial futuro",
      "Avalie potencial observando comportamentos, não apenas resultados",
      "Potencial pode ser para diferentes direções (vertical, horizontal, especialista)",
      "Dê oportunidades de stretch assignment para testar potencial"
    ],
    myths: [
      {
        myth: "Quem performa bem tem alto potencial",
        reality: "São dimensões independentes. Um especialista técnico excepcional pode ter baixo potencial gerencial. Um líder nato pode estar performando medianamente no cargo errado."
      }
    ]
  },
  {
    term: "Sucessão",
    category: "sucessao",
    summary: "Processo de identificar e preparar colaboradores para posições-chave. Garante continuidade do negócio, retenção de talentos e serve como ferramenta de desenvolvimento de carreira.",
    fullContent: `Planejamento de sucessão é uma das práticas mais estratégicas de gestão de pessoas. Empresas que não planejam sucessão correm risco de descontinuidade quando pessoas-chave saem.

**Por que é fundamental:**
- **Continuidade**: negócio não para quando alguém sai
- **Retenção**: talentos querem ver perspectiva de crescimento
- **Desenvolvimento**: prepara pessoas para próximos desafios
- **Planejamento**: decisões de promoção mais conscientes

**Conceitos-chave:**
- **Posição crítica**: cargo cujo vago geraria grande impacto
- **Sucessor imediato**: pronto para assumir em até 6 meses
- **Sucessor em desenvolvimento**: pronto em 1-2 anos
- **Pipeline de talentos**: grupo mais amplo com potencial

**Como estruturar:**
1. Mapear posições críticas
2. Identificar possíveis sucessores (9Box ajuda)
3. Avaliar gaps de cada sucessor
4. Criar PDI específico de preparação
5. Dar experiências que preparem (shadowing, projetos)
6. Revisar anualmente`,
    examples: [
      "Diretor de TI mapeou 2 sucessores: Gerente A (pronto em 6 meses) e Gerente B (pronto em 18 meses com PDI de gestão estratégica).",
      "Empresa identificou que 80% dos gerentes se aposentam em 5 anos. Criou programa acelerado de desenvolvimento de coordenadores."
    ],
    tips: [
      "Todo líder deveria ter pelo menos 2 nomes prontos para sucedê-lo",
      "Prepare sucessores com experiências, não apenas cursos",
      "Comunique expectativas aos potenciais sucessores",
      "Revise o plano de sucessão pelo menos uma vez por ano"
    ]
  },
  {
    term: "Vieses Inconscientes",
    category: "sucessao",
    summary: "Tendências cognitivas que afetam avaliações sem que percebamos. Incluem efeito halo, recência, similaridade e estereótipos. Reconhecê-los é o primeiro passo para avaliações mais justas.",
    fullContent: `Vieses inconscientes são atalhos mentais que nosso cérebro usa para processar informações rapidamente. Em avaliação de desempenho, podem distorcer percepções e gerar injustiças.

**Vieses mais comuns em avaliação:**
- **Efeito Halo**: uma característica positiva influencia toda a avaliação
- **Efeito Horn**: uma característica negativa contamina toda a avaliação
- **Recência**: eventos recentes têm peso desproporcional
- **Similaridade**: tendência a avaliar melhor pessoas parecidas
- **Estereótipos**: preconceitos sobre gênero, idade, origem
- **Tendência central**: evitar notas extremas por medo
- **Leniência**: dar notas altas para evitar conflito
- **Severidade**: ser excessivamente crítico com todos

**Como mitigar vieses:**
1. **Consciência**: reconhecer que todos têm vieses
2. **Critérios claros**: definir expectativas antes
3. **Evidências**: basear avaliação em fatos, não impressões
4. **Calibração**: discutir com outros gestores
5. **Diversidade**: buscar múltiplas perspectivas
6. **Tempo**: não avaliar às pressas`,
    examples: [
      "Efeito Halo: 'João é ótimo comunicador, então deve ser bom em tudo' - sem verificar outras competências.",
      "Recência: 'Maria errou no último projeto, então teve desempenho ruim' - ignorando 11 meses de boas entregas.",
      "Similaridade: Gestor engenheiro avalia melhor analistas com perfil técnico, mesmo quando cargo exige mais soft skills."
    ],
    tips: [
      "Documente exemplos e evidências ao longo do ano, não só no final",
      "Use a calibração como ferramenta de checagem de vieses",
      "Pergunte-se: 'Tenho evidências concretas para esta nota?'",
      "Busque feedback de pessoas diferentes sobre o mesmo colaborador"
    ]
  },
  {
    term: "Employee Experience",
    category: "sucessao",
    summary: "Jornada completa do colaborador na empresa, desde a contratação até o desligamento. A avaliação de desempenho é um ponto de contato crítico que impacta diretamente a experiência do colaborador.",
    fullContent: `Employee Experience (EX) é a soma de todas as interações e experiências que um colaborador tem com a empresa. A forma como a avaliação de desempenho é conduzida impacta fortemente a percepção geral.

**Jornada do colaborador:**
1. **Atração**: como conheceu a empresa
2. **Seleção**: processo seletivo
3. **Onboarding**: primeiros dias/meses
4. **Desenvolvimento**: crescimento e aprendizado
5. **Avaliação**: feedback e reconhecimento
6. **Promoção**: avanço de carreira
7. **Offboarding**: saída da empresa

**Como avaliação impacta EX:**
- Avaliação justa → confiança na empresa
- Avaliação injusta → desengajamento e turnover
- Feedback construtivo → desenvolvimento e motivação
- Ausência de feedback → frustração e estagnação

**Momentos críticos de verdade:**
- Primeira avaliação de desempenho
- Conversa de feedback construtivo
- Decisão de promoção ou não promoção
- PDI e acompanhamento de desenvolvimento`,
    examples: [
      "Colaborador tem excelente onboarding, mas primeira avaliação é mal conduzida: gestor não preparou, deu feedback vago. EX despenca.",
      "Empresa investe em avaliação justa, feedback frequente e PDI estruturado. Colaboradores sentem que são valorizados e desenvolvidos. EX alta."
    ],
    tips: [
      "Trate a avaliação como momento de cuidado, não de julgamento",
      "Prepare-se para a conversa de feedback como prepararia para reunião com cliente",
      "Pergunte ao colaborador como foi a experiência da avaliação",
      "Use pesquisas de EX para medir satisfação com o processo"
    ]
  }
];
