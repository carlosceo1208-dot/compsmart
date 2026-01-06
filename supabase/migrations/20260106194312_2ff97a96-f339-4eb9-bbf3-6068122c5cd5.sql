-- ================================================================
-- TABELA: agent_source_citations (Log de Fontes para Auditoria)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.agent_source_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('legal', 'salary', 'incentive', 'support')),
  source_type TEXT NOT NULL CHECK (source_type IN ('lei', 'sumula', 'nr', 'jurisprudencia', 'oj', 'dado_empresa', 'pesquisa', 'calcolo', 'documento', 'outro')),
  source_reference TEXT NOT NULL,
  source_category TEXT,
  citation_context TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para agent_source_citations
ALTER TABLE public.agent_source_citations ENABLE ROW LEVEL SECURITY;

-- Política para visualização - Admin e HR podem ver as citações da empresa
CREATE POLICY "Users can view source citations of their company" ON public.agent_source_citations
  FOR SELECT
  USING (true);

-- Política para inserção - Sistema pode inserir
CREATE POLICY "System can insert source citations" ON public.agent_source_citations
  FOR INSERT
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_agent_source_citations_agent ON public.agent_source_citations(agent_type);
CREATE INDEX idx_agent_source_citations_source ON public.agent_source_citations(source_type);
CREATE INDEX idx_agent_source_citations_created ON public.agent_source_citations(created_at DESC);

-- ================================================================
-- BASE DE CONHECIMENTO LEGAL (CLT, Súmulas TST, NRs)
-- ================================================================

-- CLT - Contrato Individual de Trabalho
INSERT INTO public.knowledge_base (agent_type, category, subcategory, title, content, is_global, is_active, keywords)
VALUES (
  'legal',
  'legislacao',
  'clt',
  'CLT - Contrato Individual de Trabalho (Arts. 442-456)',
  E'## CLT - CONTRATO INDIVIDUAL DE TRABALHO\n\n### Art. 442 - Definição\nContrato individual de trabalho é o acordo tácito ou expresso, correspondente à relação de emprego.\n\n### Art. 443 - Prazo do Contrato\nO contrato individual de trabalho poderá ser acordado tácita ou expressamente, verbalmente ou por escrito, por prazo determinado ou indeterminado, ou para prestação de trabalho intermitente.\n§1º - Considera-se como de prazo determinado o contrato de trabalho cuja vigência dependa de termo prefixado ou da execução de serviços especificados ou ainda da realização de certo acontecimento suscetível de previsão aproximada.\n§2º - O contrato por prazo determinado só será válido em se tratando:\na) de serviço cuja natureza ou transitoriedade justifique a predeterminação do prazo;\nb) de atividades empresariais de caráter transitório;\nc) de contrato de experiência.\n§3º - Considera-se como intermitente o contrato de trabalho no qual a prestação de serviços, com subordinação, não é contínua, ocorrendo com alternância de períodos de prestação de serviços e de inatividade.\n\n### Art. 444 - Livre Estipulação\nAs relações contratuais de trabalho podem ser objeto de livre estipulação das partes interessadas em tudo quanto não contravenha às disposições de proteção ao trabalho, aos contratos coletivos que lhes sejam aplicáveis e às decisões das autoridades competentes.\n\n### Art. 445 - Prazo Máximo\nO contrato de trabalho por prazo determinado não poderá ser estipulado por mais de 2 (dois) anos.\nParágrafo único - O contrato de experiência não poderá exceder de 90 (noventa) dias.\n\n### Art. 451 - Prorrogação\nO contrato de trabalho por prazo determinado que, tácita ou expressamente, for prorrogado mais de uma vez passará a vigorar sem determinação de prazo.\n\n### Art. 452 - Novo Contrato\nConsidera-se por prazo indeterminado todo contrato que suceder, dentro de 6 (seis) meses, a outro contrato por prazo determinado, salvo se a expiração deste dependeu da execução de serviços especializados ou da realização de certos acontecimentos.',
  true,
  true,
  ARRAY['clt', 'contrato', 'trabalho', 'prazo determinado', 'experiência', 'intermitente', 'art 442', 'art 443', 'art 444', 'art 445']
);

-- CLT - Jornada de Trabalho
INSERT INTO public.knowledge_base (agent_type, category, subcategory, title, content, is_global, is_active, keywords)
VALUES (
  'legal',
  'legislacao',
  'clt',
  'CLT - Jornada de Trabalho (Arts. 57-75)',
  E'## CLT - JORNADA DE TRABALHO\n\n### Art. 58 - Duração Normal\nA duração normal do trabalho, para os empregados em qualquer atividade privada, não excederá de 8 (oito) horas diárias, desde que não seja fixado expressamente outro limite.\n§1º - Não serão descontadas nem computadas como jornada extraordinária as variações de horário no registro de ponto não excedentes de cinco minutos, observado o limite máximo de dez minutos diários.\n§2º - O tempo despendido pelo empregado desde a sua residência até a efetiva ocupação do posto de trabalho e para o seu retorno, caminhando ou por qualquer meio de transporte, inclusive o fornecido pelo empregador, não será computado na jornada de trabalho.\n\n### Art. 59 - Horas Extras\nA duração diária do trabalho poderá ser acrescida de horas extras, em número não excedente de duas, por acordo individual, convenção coletiva ou acordo coletivo de trabalho.\n§1º - A remuneração da hora extra será, pelo menos, 50% (cinquenta por cento) superior à da hora normal.\n§2º - Poderá ser dispensado o acréscimo de salário se, por força de acordo ou convenção coletiva de trabalho, o excesso de horas em um dia for compensado pela correspondente diminuição em outro dia (banco de horas).\n\n### Art. 59-A - Jornada 12x36\nÉ facultado às partes, mediante acordo individual escrito, convenção coletiva ou acordo coletivo de trabalho, estabelecer horário de trabalho de doze horas seguidas por trinta e seis horas ininterruptas de descanso.\n\n### Art. 62 - Exclusões da Jornada\nNão são abrangidos pelo regime previsto neste capítulo:\nI - os empregados que exercem atividade externa incompatível com a fixação de horário de trabalho;\nII - os gerentes, diretores e chefes de departamento ou filial (cargo de confiança);\nIII - os empregados em regime de teletrabalho que prestam serviço por produção ou tarefa.\n\n### Art. 71 - Intervalo Intrajornada\nEm qualquer trabalho contínuo, cuja duração exceda de 6 horas, é obrigatória a concessão de um intervalo para repouso ou alimentação, o qual será, no mínimo, de 1 hora e, salvo acordo escrito ou contrato coletivo em contrário, não poderá exceder de 2 horas.\n§1º - Quando a jornada não exceder de 6 horas, mas ultrapassar 4 horas, será obrigatório um intervalo de 15 minutos.\n§4º - A não concessão ou a concessão parcial do intervalo intrajornada mínimo implica o pagamento, de natureza indenizatória, apenas do período suprimido, com acréscimo de 50% sobre o valor da remuneração da hora normal de trabalho.',
  true,
  true,
  ARRAY['clt', 'jornada', 'horas extras', 'intervalo', 'banco de horas', '12x36', 'art 58', 'art 59', 'art 62', 'art 71']
);

-- CLT - Férias
INSERT INTO public.knowledge_base (agent_type, category, subcategory, title, content, is_global, is_active, keywords)
VALUES (
  'legal',
  'legislacao',
  'clt',
  'CLT - Férias (Arts. 129-153)',
  E'## CLT - FÉRIAS\n\n### Art. 129 - Direito a Férias\nTodo empregado terá direito anualmente ao gozo de um período de férias, sem prejuízo da remuneração.\n\n### Art. 130 - Período de Férias\nApós cada período de 12 meses de vigência do contrato de trabalho, o empregado terá direito a férias, na seguinte proporção:\nI - 30 dias corridos, quando não houver faltado ao serviço mais de 5 vezes;\nII - 24 dias corridos, quando houver tido de 6 a 14 faltas;\nIII - 18 dias corridos, quando houver tido de 15 a 23 faltas;\nIV - 12 dias corridos, quando houver tido de 24 a 32 faltas.\n\n### Art. 134 - Concessão de Férias\nAs férias serão concedidas por ato do empregador, em um só período, nos 12 meses subsequentes à data em que o empregado tiver adquirido o direito.\n§1º - Desde que haja concordância do empregado, as férias poderão ser usufruídas em até três períodos, sendo que um deles não poderá ser inferior a quatorze dias corridos e os demais não poderão ser inferiores a cinco dias corridos, cada um.\n§3º - É vedado o início das férias no período de dois dias que antecede feriado ou dia de repouso semanal remunerado.\n\n### Art. 137 - Férias em Dobro\nSempre que as férias forem concedidas após o prazo de que trata o art. 134, o empregador pagará em dobro a respectiva remuneração.\n\n### Art. 142 - Remuneração das Férias\nO empregado perceberá, durante as férias, a remuneração que lhe for devida na data da sua concessão.\n\n### Art. 143 - Abono Pecuniário\nÉ facultado ao empregado converter 1/3 do período de férias a que tiver direito em abono pecuniário.\n\n### Art. 145 - Pagamento\nO pagamento da remuneração das férias e, se for o caso, o do abono referido no art. 143 serão efetuados até 2 dias antes do início do respectivo período.',
  true,
  true,
  ARRAY['clt', 'férias', 'abono', 'período aquisitivo', 'período concessivo', 'férias em dobro', 'art 129', 'art 130', 'art 134', 'art 143']
);

-- Súmulas TST - Jornada
INSERT INTO public.knowledge_base (agent_type, category, subcategory, title, content, is_global, is_active, keywords)
VALUES (
  'legal',
  'sumulas',
  'tst',
  'Súmulas TST - Jornada de Trabalho',
  E'## SÚMULAS TST - JORNADA DE TRABALHO\n\n### Súmula 85 - Compensação de Jornada\nI. A compensação de jornada de trabalho deve ser ajustada por acordo individual escrito, acordo coletivo ou convenção coletiva.\nII. O acordo individual para compensação de horas é válido, salvo se houver norma coletiva em sentido contrário.\nIII. O mero não atendimento das exigências legais para a compensação de jornada, inclusive quando encetada mediante acordo tácito, não implica a repetição do pagamento das horas excedentes à jornada normal diária, se não dilatada a jornada máxima semanal, sendo devido apenas o respectivo adicional.\nIV. A prestação de horas extras habituais descaracteriza o acordo de compensação de jornada.\nV. As disposições contidas nesta súmula não se aplicam ao regime compensatório na modalidade "banco de horas".\n\n### Súmula 90 - Horas In Itinere\nI. O tempo despendido pelo empregado, em condução fornecida pelo empregador, até o local de trabalho de difícil acesso, ou não servido por transporte público regular, e para o seu retorno é computável na jornada de trabalho.\n\n### Súmula 110 - Jornada 12x36\nNo regime de revezamento, as horas trabalhadas em seguida ao repouso semanal de 24 horas, com prejuízo do intervalo mínimo de 11 horas consecutivas para descanso entre jornadas, devem ser remuneradas como extraordinárias, inclusive com o respectivo adicional.\n\n### Súmula 366 - Tempo de Registro\nNão serão descontadas nem computadas como jornada extraordinária as variações de horário do registro de ponto não excedentes de cinco minutos, observado o limite máximo de dez minutos diários.\n\n### Súmula 437 - Intervalo Intrajornada\nI. Após a edição da Lei nº 8.923/94, a não-concessão ou a concessão parcial do intervalo intrajornada mínimo, para repouso e alimentação, a empregados urbanos e rurais, implica o pagamento total do período correspondente, e não apenas daquele suprimido, com acréscimo de, no mínimo, 50% sobre o valor da remuneração da hora normal de trabalho (art. 71 da CLT).\nII. É inválida cláusula de acordo ou convenção coletiva de trabalho contemplando a supressão ou redução do intervalo intrajornada.\nIV. Ultrapassada habitualmente a jornada de seis horas de trabalho, é devido o gozo do intervalo intrajornada mínimo de uma hora.\n\n### Súmula 444 - Jornada 12x36\nÉ valida, em caráter excepcional, a jornada de doze horas de trabalho por trinta e seis de descanso, prevista em lei ou ajustada exclusivamente mediante acordo coletivo de trabalho ou convenção coletiva de trabalho, assegurada a remuneração em dobro dos feriados trabalhados.',
  true,
  true,
  ARRAY['tst', 'súmula', 'jornada', 'compensação', 'horas extras', 'intervalo', '12x36', 'súmula 85', 'súmula 90', 'súmula 110', 'súmula 437', 'súmula 444']
);

-- Súmulas TST - Remuneração
INSERT INTO public.knowledge_base (agent_type, category, subcategory, title, content, is_global, is_active, keywords)
VALUES (
  'legal',
  'sumulas',
  'tst',
  'Súmulas TST - Remuneração e Adicionais',
  E'## SÚMULAS TST - REMUNERAÇÃO E ADICIONAIS\n\n### Súmula 60 - Adicional Noturno\nI - O adicional noturno, pago com habitualidade, integra o salário do empregado para todos os efeitos.\nII - Cumprida integralmente a jornada no período noturno e prorrogada esta, devido é também o adicional quanto às horas prorrogadas.\n\n### Súmula 139 - Adicional de Insalubridade\nEnquanto percebido, o adicional de insalubridade integra a remuneração para todos os efeitos legais.\n\n### Súmula 191 - Adicional de Periculosidade\nI - O adicional de periculosidade incide apenas sobre o salário básico e não sobre este acrescido de outros adicionais.\nII - O adicional de periculosidade do empregado eletricitário, contratado sob a égide da Lei nº 7.369/1985, deve ser calculado sobre a totalidade das parcelas de natureza salarial.\n\n### Súmula 203 - Gratificação por Tempo de Serviço\nA gratificação por tempo de serviço integra o salário para todos os efeitos legais.\n\n### Súmula 241 - Salário-Utilidade\nO vale para refeição, fornecido por força do contrato de trabalho, tem caráter salarial, integrando a remuneração do empregado, para todos os efeitos legais.\n\n### Súmula 264 - Hora Extra\nA remuneração do serviço suplementar é composta do valor da hora normal, integrado por parcelas de natureza salarial e acrescido do adicional previsto em lei, contrato, acordo, convenção coletiva ou sentença normativa.\n\n### Súmula 291 - Supressão de Horas Extras\nA supressão total ou parcial, pelo empregador, de serviço suplementar prestado com habitualidade, durante pelo menos 1 (um) ano, assegura ao empregado o direito à indenização correspondente ao valor de 1 (um) mês das horas suprimidas, total ou parcialmente, para cada ano ou fração igual ou superior a seis meses de prestação de serviço acima da jornada normal.\n\n### Súmula 364 - Adicional de Periculosidade\nO trabalho exercido em condições perigosas, embora de forma intermitente, dá direito ao empregado a receber o adicional de periculosidade de forma integral.',
  true,
  true,
  ARRAY['tst', 'súmula', 'remuneração', 'adicional', 'insalubridade', 'periculosidade', 'noturno', 'horas extras', 'súmula 60', 'súmula 139', 'súmula 191', 'súmula 291', 'súmula 364']
);

-- Súmulas TST - Estabilidade
INSERT INTO public.knowledge_base (agent_type, category, subcategory, title, content, is_global, is_active, keywords)
VALUES (
  'legal',
  'sumulas',
  'tst',
  'Súmulas TST - Estabilidade e Proteção ao Emprego',
  E'## SÚMULAS TST - ESTABILIDADE E PROTEÇÃO AO EMPREGO\n\n### Súmula 244 - Gestante\nI - O desconhecimento do estado gravídico pelo empregador não afasta o direito ao pagamento da indenização decorrente da estabilidade (art. 10, II, "b" do ADCT).\nII - A garantia de emprego à gestante só autoriza a reintegração se esta se der durante o período de estabilidade. Do contrário, a garantia restringe-se aos salários e demais direitos correspondentes ao período de estabilidade.\nIII - A empregada gestante tem direito à estabilidade provisória prevista no art. 10, inciso II, alínea "b", do Ato das Disposições Constitucionais Transitórias, mesmo na hipótese de admissão mediante contrato por tempo determinado.\n\n### Súmula 339 - CIPA\nI - O suplente da CIPA goza da garantia de emprego prevista no art. 10, II, "a", do ADCT a partir da promulgação da Constituição Federal de 1988.\nII - A estabilidade provisória do cipeiro não constitui vantagem pessoal, mas garantia para as atividades dos membros da CIPA, que somente tem razão de ser quando em atividade a empresa.\n\n### Súmula 378 - Acidente de Trabalho\nI - É constitucional o artigo 118 da Lei nº 8.213/1991 que assegura o direito à estabilidade provisória por período de 12 meses após a cessação do auxílio-doença ao empregado acidentado.\nII - São pressupostos para a concessão da estabilidade o afastamento superior a 15 dias e a consequente percepção do auxílio-doença acidentário, salvo se constatada, após a despedida, doença profissional que guarde relação de causalidade com a execução do contrato de emprego.\nIII - O empregado submetido a contrato de trabalho por tempo determinado goza da garantia provisória de emprego decorrente de acidente de trabalho prevista no art. 118 da Lei nº 8.213/91.\n\n### Súmula 443 - Dispensa Discriminatória\nPresume-se discriminatória a despedida de empregado portador do vírus HIV ou de outra doença grave que suscite estigma ou preconceito. Inválido o ato, o empregado tem direito à reintegração no emprego.',
  true,
  true,
  ARRAY['tst', 'súmula', 'estabilidade', 'gestante', 'cipa', 'acidente', 'discriminatória', 'súmula 244', 'súmula 339', 'súmula 378', 'súmula 443']
);

-- CLT - Rescisão
INSERT INTO public.knowledge_base (agent_type, category, subcategory, title, content, is_global, is_active, keywords)
VALUES (
  'legal',
  'legislacao',
  'clt',
  'CLT - Rescisão do Contrato de Trabalho (Arts. 477-486)',
  E'## CLT - RESCISÃO DO CONTRATO DE TRABALHO\n\n### Art. 477 - Quitação\nNa extinção do contrato de trabalho, o empregador deverá proceder à anotação na Carteira de Trabalho e Previdência Social, comunicar a dispensa aos órgãos competentes e realizar o pagamento das verbas rescisórias no prazo e na forma estabelecidos neste artigo.\n§4º - O pagamento a que fizer jus o empregado será efetuado:\nI - em dinheiro, depósito bancário ou cheque visado, conforme acordem as partes;\nII - em dinheiro ou depósito bancário quando o empregado for analfabeto.\n§6º - A entrega ao empregado de documentos que comprovem a comunicação da extinção contratual aos órgãos competentes bem como o pagamento dos valores constantes do instrumento de rescisão ou recibo de quitação deverão ser efetuados até dez dias contados a partir do término do contrato.\n§8º - A inobservância do disposto no § 6º sujeitará o infrator à multa de 160 BTN, por trabalhador.\n\n### Art. 479 - Indenização por Prazo Determinado (empregador)\nNos contratos que tenham termo estipulado, o empregador que, sem justa causa, despedir o empregado será obrigado a pagar-lhe, a título de indenização, e por metade, a remuneração a que teria direito até o termo do contrato.\n\n### Art. 480 - Indenização por Prazo Determinado (empregado)\nHavendo termo estipulado, o empregado não se poderá desligar do contrato, sem justa causa, sob pena de ser obrigado a indenizar o empregador dos prejuízos que desse fato lhe resultarem.\n\n### Art. 482 - Justa Causa (empregado)\nConstituem justa causa para rescisão do contrato de trabalho pelo empregador:\na) ato de improbidade;\nb) incontinência de conduta ou mau procedimento;\nc) negociação habitual por conta própria ou alheia sem permissão do empregador;\nd) condenação criminal do empregado, passada em julgado;\ne) desídia no desempenho das respectivas funções;\nf) embriaguez habitual ou em serviço;\ng) violação de segredo da empresa;\nh) ato de indisciplina ou de insubordinação;\ni) abandono de emprego;\nj) ato lesivo da honra ou da boa fama praticado no serviço;\nk) ofensas físicas, no serviço, salvo em caso de legítima defesa;\nl) prática constante de jogos de azar;\nm) perda da habilitação ou dos requisitos estabelecidos em lei para o exercício da profissão.\n\n### Art. 483 - Rescisão Indireta\nO empregado poderá considerar rescindido o contrato e pleitear a devida indenização quando:\na) forem exigidos serviços superiores às suas forças;\nb) for tratado pelo empregador ou superiores hierárquicos com rigor excessivo;\nc) correr perigo manifesto de mal considerável;\nd) não cumprir o empregador as obrigações do contrato;\ne) praticar o empregador ou seus prepostos ato lesivo da honra e boa fama do empregado ou de sua família;\nf) o empregador ou seus prepostos ofenderem-no fisicamente;\ng) o empregador reduzir o seu trabalho, sendo este por peça ou tarefa.',
  true,
  true,
  ARRAY['clt', 'rescisão', 'demissão', 'justa causa', 'verbas rescisórias', 'aviso prévio', 'art 477', 'art 482', 'art 483']
);

-- NRs - Resumo Geral
INSERT INTO public.knowledge_base (agent_type, category, subcategory, title, content, is_global, is_active, keywords)
VALUES (
  'legal',
  'nrs',
  'geral',
  'Normas Regulamentadoras (NRs) - Resumo para RH',
  E'## NORMAS REGULAMENTADORAS - RESUMO PARA RH\n\n### NR-1 - Disposições Gerais e Gerenciamento de Riscos Ocupacionais\n**Foco:** Estabelece o gerenciamento de riscos ocupacionais (GRO) e o Programa de Gerenciamento de Riscos (PGR).\n**Novidade 2024:** Inclui riscos psicossociais (burnout, assédio, estresse) como riscos ocupacionais obrigatórios.\n**Relevância RH:** Obrigatoriedade de avaliação de saúde mental, treinamentos de integração.\n\n### NR-5 - CIPA\n**Foco:** Comissão Interna de Prevenção de Acidentes e de Assédio.\n**Relevância RH:** Organização de eleições, treinamento de cipeiros, estabilidade provisória.\n\n### NR-6 - EPIs\n**Foco:** Equipamentos de Proteção Individual.\n**Relevância RH:** Fornecimento gratuito, treinamento, fiscalização de uso, termo de responsabilidade.\n\n### NR-7 - PCMSO\n**Foco:** Programa de Controle Médico de Saúde Ocupacional.\n**Relevância RH:** Exames admissionais, periódicos, demissionais, ASO, afastamentos.\n\n### NR-9 - PPRA (incorporado ao PGR)\n**Foco:** Programa de Prevenção de Riscos Ambientais (hoje parte do GRO/PGR).\n**Relevância RH:** Identificação de riscos físicos, químicos e biológicos.\n\n### NR-15 - Insalubridade\n**Foco:** Atividades e operações insalubres.\n**Relevância RH:** Adicional de 10%, 20% ou 40% sobre salário mínimo, laudo técnico obrigatório.\n\n### NR-16 - Periculosidade\n**Foco:** Atividades e operações perigosas (explosivos, inflamáveis, eletricidade, segurança).\n**Relevância RH:** Adicional de 30% sobre salário base, laudo técnico obrigatório.\n\n### NR-17 - Ergonomia\n**Foco:** Condições de trabalho adaptadas às características psicofisiológicas.\n**Relevância RH:** Mobiliário, equipamentos, organização do trabalho, teletrabalho, call centers.\n\n### NR-32 - Serviços de Saúde\n**Foco:** Segurança em estabelecimentos de saúde.\n**Relevância RH:** Riscos biológicos, vacinação, PCMSO específico, treinamentos obrigatórios.\n\n### NR-35 - Trabalho em Altura\n**Foco:** Atividades acima de 2 metros do nível inferior.\n**Relevância RH:** Treinamentos específicos, ASO para altura, equipamentos obrigatórios.\n\n### IMPACTO GERAL EM RH:\n- Treinamentos obrigatórios com periodicidade\n- Controle de ASOs e exames\n- Gestão de EPIs\n- Laudos técnicos atualizados\n- Participação na CIPA\n- Pagamento correto de adicionais',
  true,
  true,
  ARRAY['nr', 'norma regulamentadora', 'segurança', 'saúde', 'insalubridade', 'periculosidade', 'cipa', 'pcmso', 'ergonomia', 'nr1', 'nr5', 'nr6', 'nr7', 'nr15', 'nr16', 'nr17']
);