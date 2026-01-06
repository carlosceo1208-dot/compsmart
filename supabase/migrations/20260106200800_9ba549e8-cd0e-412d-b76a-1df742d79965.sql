-- =====================================================
-- CORREÇÃO DE RLS E EXPANSÃO DA BASE DE CONHECIMENTO LEGAL
-- =====================================================

-- 1. CORRIGIR POLÍTICAS RLS DA TABELA agent_source_citations
-- Remover política permissiva atual
DROP POLICY IF EXISTS "Users can view source citations of their company" ON agent_source_citations;

-- Criar política corrigida: apenas usuários autenticados podem visualizar
CREATE POLICY "Authenticated users can view all source citations"
ON agent_source_citations
FOR SELECT
TO authenticated
USING (true);

-- Política para inserção: edge functions usam service_role que bypass RLS
-- INSERT não precisa de política especial pois service_role tem acesso total

-- 2. EXPANDIR BASE DE CONHECIMENTO LEGAL
-- CLT - Contrato de Trabalho (Arts. 442-456)
INSERT INTO knowledge_base (title, content, category, agent_type, is_global, is_active)
VALUES (
  'CLT - Contrato Individual de Trabalho (Arts. 442-456)',
  'CONTRATO INDIVIDUAL DE TRABALHO - CLT

Art. 442 - Contrato individual de trabalho é o acordo tácito ou expresso, correspondente à relação de emprego.
§1º (Revogado pela Lei 13.467/2017)
§2º Não se considera empregador a empresa principal para fins de responsabilidade subsidiária pelos direitos dos trabalhadores terceirizados.

Art. 443 - O contrato individual de trabalho poderá ser acordado tácita ou expressamente, verbalmente ou por escrito, por prazo determinado ou indeterminado, ou para prestação de trabalho intermitente.
§1º Considera-se como de prazo determinado o contrato de trabalho cuja vigência dependa de termo prefixado ou da execução de serviços especificados ou ainda da realização de certo acontecimento suscetível de previsão aproximada.
§2º O contrato por prazo determinado só será válido em se tratando: a) de serviço cuja natureza ou transitoriedade justifique a predeterminação do prazo; b) de atividades empresariais de caráter transitório; c) de contrato de experiência.
§3º Considera-se como intermitente o contrato de trabalho no qual a prestação de serviços, com subordinação, não é contínua, ocorrendo com alternância de períodos de prestação de serviços e de inatividade.

Art. 444 - As relações contratuais de trabalho podem ser objeto de livre estipulação das partes interessadas em tudo quanto não contravenha às disposições de proteção ao trabalho, aos contratos coletivos que lhes sejam aplicáveis e às decisões das autoridades competentes.
Parágrafo único - A livre estipulação a que se refere o caput deste artigo aplica-se às hipóteses previstas no art. 611-A desta Consolidação, com a mesma eficácia legal e preponderância sobre os instrumentos coletivos, no caso de empregado portador de diploma de nível superior e que perceba salário mensal igual ou superior a duas vezes o limite máximo dos benefícios do Regime Geral de Previdência Social.

Art. 445 - O contrato de trabalho por prazo determinado não poderá ser estipulado por mais de 2 (dois) anos.
Parágrafo único - O contrato de experiência não poderá exceder de 90 (noventa) dias.

Art. 446 (Revogado)

Art. 447 - Na falta de acordo ou prova sobre condição essencial ao contrato verbal, esta se presume existente, como se a tivessem estatuído os interessados na conformidade dos preceitos jurídicos adequados à sua legitimidade.

Art. 448 - A mudança na propriedade ou na estrutura jurídica da empresa não afetará os contratos de trabalho dos respectivos empregados.
Art. 448-A - Caracterizada a sucessão empresarial ou de empregadores, as obrigações trabalhistas, inclusive as contraídas à época em que os empregados trabalhavam para a empresa sucedida, são de responsabilidade do sucessor.

Art. 449 - Os direitos oriundos da existência do contrato de trabalho subsistirão em caso de falência, concordata ou dissolução da empresa.

Art. 451 - O contrato de trabalho por prazo determinado que, tácita ou expressamente, for prorrogado mais de uma vez passará a vigorar sem determinação de prazo.

Art. 452 - Considera-se por prazo indeterminado todo contrato que suceder, dentro de 6 (seis) meses, a outro contrato por prazo determinado, salvo se a expiração deste dependeu da execução de serviços especializados ou da realização de certos acontecimentos.

Art. 453 - No tempo de serviço do empregado, quando readmitido, serão computados os períodos, ainda que não contínuos, em que tiver trabalhado anteriormente na empresa, salvo se houver sido despedido por falta grave, recebido indenização legal ou se aposentado espontaneamente.',
  'CLT',
  'legal',
  true,
  true
);

-- CLT - Rescisão do Contrato (Arts. 477-486)
INSERT INTO knowledge_base (title, content, category, agent_type, is_global, is_active)
VALUES (
  'CLT - Rescisão do Contrato de Trabalho (Arts. 477-486)',
  'RESCISÃO DO CONTRATO DE TRABALHO - CLT

Art. 477 - Na extinção do contrato de trabalho, o empregador deverá proceder à anotação na Carteira de Trabalho e Previdência Social, comunicar a dispensa aos órgãos competentes e realizar o pagamento das verbas rescisórias no prazo e na forma estabelecidos neste artigo.
§1º (Revogado pela Lei 13.467/2017)
§2º O instrumento de rescisão ou recibo de quitação, qualquer que seja a causa ou forma de dissolução do contrato, deve ter especificada a natureza de cada parcela paga ao empregado e discriminado o seu valor, sendo válida a quitação, apenas, relativamente às mesmas parcelas.
§3º e §4º (Revogados)
§5º Qualquer compensação no pagamento de que trata o parágrafo anterior não poderá exceder o equivalente a um mês de remuneração do empregado.
§6º A entrega ao empregado de documentos que comprovem a comunicação da extinção contratual aos órgãos competentes bem como o pagamento dos valores constantes do instrumento de rescisão ou recibo de quitação deverão ser efetuados até dez dias contados a partir do término do contrato.
§8º A inobservância do disposto no §6º deste artigo sujeitará o infrator à multa de 160 BTN, por trabalhador, bem assim ao pagamento da multa a favor do empregado, em valor equivalente ao seu salário, devidamente corrigido pelo índice de variação do BTN, salvo quando, comprovadamente, o trabalhador der causa à mora.
§10 A anotação da extinção do contrato na Carteira de Trabalho e Previdência Social é documento hábil para requerer o benefício do seguro-desemprego e a movimentação da conta vinculada no FGTS, nas hipóteses legais, desde que a comunicação prevista no caput deste artigo tenha sido realizada.

Art. 477-A - As dispensas imotivadas individuais, plúrimas ou coletivas equiparam-se para todos os fins, não havendo necessidade de autorização prévia de entidade sindical ou de celebração de convenção coletiva ou acordo coletivo de trabalho para sua efetivação.

Art. 477-B - Plano de Demissão Voluntária ou Incentivada, para dispensa individual, plúrima ou coletiva, previsto em convenção coletiva ou acordo coletivo de trabalho, enseja quitação plena e irrevogável dos direitos decorrentes da relação empregatícia, salvo disposição em contrário estipulada entre as partes.

Art. 478 - A indenização devida pela rescisão de contrato por prazo indeterminado será de 1 (um) mês de remuneração por ano de serviço efetivo, ou por ano e fração igual ou superior a 6 (seis) meses.

Art. 479 - Nos contratos que tenham termo estipulado, o empregador que, sem justa causa, despedir o empregado será obrigado a pagar-lhe, a título de indenização, e por metade, a remuneração a que teria direito até o termo do contrato.

Art. 480 - Havendo termo estipulado, o empregado não se poderá desligar do contrato, sem justa causa, sob pena de ser obrigado a indenizar o empregador dos prejuízos que desse fato lhe resultarem.
§1º A indenização, porém, não poderá exceder àquela a que teria direito o empregado em idênticas condições.

Art. 481 - Aos contratos por prazo determinado, que contiverem cláusula assecuratória do direito recíproco de rescisão antes de expirado o termo ajustado, aplicam-se, caso seja exercido tal direito por qualquer das partes, os princípios que regem a rescisão dos contratos por prazo indeterminado.

Art. 482 - Constituem justa causa para rescisão do contrato de trabalho pelo empregador:
a) ato de improbidade;
b) incontinência de conduta ou mau procedimento;
c) negociação habitual por conta própria ou alheia sem permissão do empregador;
d) condenação criminal do empregado;
e) desídia no desempenho das respectivas funções;
f) embriaguez habitual ou em serviço;
g) violação de segredo da empresa;
h) ato de indisciplina ou de insubordinação;
i) abandono de emprego;
j) ato lesivo da honra ou da boa fama praticado no serviço contra qualquer pessoa;
k) ato lesivo da honra ou da boa fama ou ofensas físicas praticadas contra o empregador;
l) prática constante de jogos de azar;
m) perda da habilitação ou dos requisitos estabelecidos em lei para o exercício da profissão.

Art. 483 - O empregado poderá considerar rescindido o contrato e pleitear a devida indenização quando:
a) forem exigidos serviços superiores às suas forças;
b) for tratado pelo empregador ou por seus superiores hierárquicos com rigor excessivo;
c) correr perigo manifesto de mal considerável;
d) não cumprir o empregador as obrigações do contrato;
e) praticar o empregador ou seus prepostos, contra ele ou pessoas de sua família, ato lesivo da honra e boa fama;
f) o empregador ou seus prepostos ofenderem-no fisicamente;
g) o empregador reduzir o seu trabalho, sendo este por peça ou tarefa.',
  'CLT',
  'legal',
  true,
  true
);

-- Reforma Trabalhista - Lei 13.467/2017
INSERT INTO knowledge_base (title, content, category, agent_type, is_global, is_active)
VALUES (
  'Reforma Trabalhista - Principais Alterações (Lei 13.467/2017)',
  'REFORMA TRABALHISTA - LEI 13.467/2017 (Principais Alterações)

1. PREVALÊNCIA DO NEGOCIADO SOBRE O LEGISLADO (Art. 611-A)
A convenção coletiva e o acordo coletivo de trabalho têm prevalência sobre a lei quando, entre outros, dispuserem sobre:
- Pacto quanto à jornada de trabalho, observados os limites constitucionais
- Banco de horas anual
- Intervalo intrajornada, respeitado o limite mínimo de 30 minutos para jornadas superiores a 6 horas
- Teletrabalho, regime de sobreaviso, e trabalho intermitente
- Remuneração por produtividade, incluídas as gorjetas
- Troca do dia de feriado
- Identificação dos cargos que se enquadram como funções de confiança
- Regulamento empresarial
- Representante dos trabalhadores no local de trabalho
- Participação nos lucros ou resultados da empresa

2. TELETRABALHO (Arts. 75-A a 75-E)
- Definição: prestação de serviços preponderantemente fora das dependências do empregador
- Deve constar expressamente do contrato individual de trabalho
- Aquisição, manutenção e fornecimento de equipamentos devem estar previstos em contrato
- Não sujeito a controle de jornada (Art. 62, III)
- Alteração pode ser feita por mútuo acordo ou determinação do empregador (com prazo mínimo de 15 dias)

3. TRABALHO INTERMITENTE (Art. 443, §3º e Arts. 452-A e seguintes)
- Contrato por escrito com valor da hora de trabalho (não inferior ao salário mínimo hora)
- Convocação com antecedência mínima de 3 dias corridos
- Trabalhador pode recusar em até 1 dia útil
- Ao final de cada período de prestação de serviço: pagamento imediato de remuneração, férias proporcionais + 1/3, 13º proporcional, DSR e adicionais

4. JORNADA DE TRABALHO
- Jornada 12x36: pode ser pactuada por acordo individual escrito (Art. 59-A)
- Banco de horas: compensação em até 6 meses por acordo individual (Art. 59, §5º)
- Tempo à disposição: não se considera tempo à disposição as atividades particulares do empregado (Art. 4º, §2º)
- Intervalo intrajornada: pode ser reduzido a 30 minutos por negociação (Art. 611-A, III)

5. EXTINÇÃO DO CONTRATO
- Homologação sindical: não é mais obrigatória (Art. 477 - revogados §§1º, 3º e 4º)
- Prazo para pagamento: 10 dias a partir do término do contrato (Art. 477, §6º)
- Demissão por acordo (Art. 484-A): metade do aviso prévio, 20% da multa do FGTS, saque de 80% do FGTS, sem seguro-desemprego

6. CONTRIBUIÇÃO SINDICAL
- Passa a ser facultativa, dependente de autorização prévia e expressa do empregado (Art. 578 e seguintes)

7. DANOS EXTRAPATRIMONIAIS (Arts. 223-A a 223-G)
- Criação de parâmetros para indenização por danos morais no trabalho
- Valores máximos vinculados ao salário contratual do ofendido
- Ofensa de natureza leve: até 3x o salário
- Ofensa de natureza média: até 5x o salário
- Ofensa de natureza grave: até 20x o salário
- Ofensa de natureza gravíssima: até 50x o salário

8. EMPREGADO HIPERSUFICIENTE (Art. 444, Parágrafo único)
- Portador de diploma de nível superior
- Que perceba salário mensal igual ou superior a 2x o teto do RGPS
- Pode negociar individualmente as matérias do Art. 611-A

9. TERCEIRIZAÇÃO
- Permitida para qualquer atividade (Lei 13.429/2017 + 13.467/2017)
- Quarentena: não pode prestar serviços para empresa que foi seu empregador nos últimos 18 meses',
  'Legislação',
  'legal',
  true,
  true
);

-- OJs do TST - SDI-1 mais utilizadas
INSERT INTO knowledge_base (title, content, category, agent_type, is_global, is_active)
VALUES (
  'OJs do TST - SDI-1 (Orientações Jurisprudenciais Mais Utilizadas)',
  'ORIENTAÇÕES JURISPRUDENCIAIS - SDI-1 DO TST (Seleção das mais utilizadas)

OJ-SDI1-41 - ESTABILIDADE. INSTRUMENTO NORMATIVO. VIGÊNCIA. EFICÁCIA
Preenchidos todos os pressupostos para a aquisição de estabilidade decorrente de acidente ou doença profissional, ainda durante a vigência do instrumento normativo, goza o empregado de estabilidade mesmo após o término da vigência deste.

OJ-SDI1-42 - FGTS. MULTA DE 40%. PARCELA
A base de cálculo da multa de 40% é o saldo da conta do FGTS, acrescido da atualização monetária e juros.

OJ-SDI1-88 - JORNADA DE TRABALHO. INTERVALO ENTRE TURNOS. NÃO COMPUTADO
O tempo despendido pelo empregado entre a residência e o local de trabalho, ou vice-versa, não é computado como jornada de trabalho.

OJ-SDI1-247 - SERVIDOR PÚBLICO. CELETISTA CONCURSADO. DESPEDIDA IMOTIVADA. EMPRESA PÚBLICA OU SOCIEDADE DE ECONOMIA MISTA. POSSIBILIDADE
I - A despedida de empregados de empresa pública e de sociedade de economia mista, mesmo admitidos por concurso público, independe de ato motivado para sua validade.
II - A validade do ato de despedida do empregado da Empresa Brasileira de Correios e Telégrafos (ECT) está condicionada à motivação, por gozar a empresa do mesmo tratamento destinado à Fazenda Pública em relação à imunidade tributária e à execução por precatório, além das prerrogativas de foro, prazos e custas processuais.

OJ-SDI1-252 - DESCONTOS ASSISTENCIAIS. LEGISLAÇÃO MENCIONADA
O art. 477, § 5º, da CLT não autoriza a dedução de descontos assistenciais em instrumento de rescisão do contrato de trabalho homologado.

OJ-SDI1-323 - ACORDO HOMOLOGADO. INEXISTÊNCIA DE VÍCIO DE CONSENTIMENTO. LESÃO
O acordo homologado judicialmente tem força de coisa julgada material, não admitindo a revisão por meio de ação rescisória por vícios não apontados na homologação.

OJ-SDI1-355 - INTERVALO INTERJORNADAS. INOBSERVÂNCIA. HORAS EXTRAS. PERÍODO PAGO COMO SOBREJORNADA
O desrespeito ao intervalo mínimo interjornadas previsto no art. 66 da CLT acarreta, por analogia, os mesmos efeitos previstos no § 4º do art. 71 da CLT e na Súmula nº 110 do TST, devendo-se pagar a integralidade das horas que foram subtraídas do intervalo, acrescidas do respectivo adicional.

OJ-SDI1-378 - AVISO PRÉVIO. AUSÊNCIA DE CONCESSÃO. INDENIZAÇÃO
O pagamento correspondente ao período do aviso prévio, ainda que não tenha havido a respectiva concessão pelo empregador, gera direito à integração ao FGTS.

OJ-SDI1-394 - REPOUSO SEMANAL REMUNERADO - RSR. INTEGRAÇÃO DAS HORAS EXTRAS
A majoração do valor do repouso semanal remunerado, em razão da integração das horas extras habitualmente prestadas, não repercute no cálculo das férias, da gratificação natalina, do aviso prévio e do FGTS, sob pena de caracterização de bis in idem.

OJ-SDI1-406 - ADICIONAL DE PERICULOSIDADE. BASE DE CÁLCULO. ELETRICITÁRIOS. LEI Nº 7.369/85
O adicional de periculosidade dos eletricitários deverá ser calculado sobre a totalidade das parcelas de natureza salarial.

OJ-SDI1-411 - REPRESENTAÇÃO COMERCIAL. CONTRATO DE TRABALHO. SENTENÇA DECLARATÓRIA. PRESCRIÇÃO
O prazo prescricional para ajuizamento da reclamação trabalhista contra empresa que se utiliza de representante comercial autônomo com os requisitos próprios da relação de emprego conta-se do trânsito em julgado da sentença declaratória da relação de emprego.

OJ-SDI1-415 - HORAS EXTRAS. MINUTOS QUE ANTECEDEM E SUCEDEM A JORNADA DE TRABALHO
A partir da vigência da Lei nº 10.243, de 19.06.2001, que acrescentou o § 1º ao art. 58 da CLT, não mais prevalece cláusula prevista em convenção ou acordo coletivo que elastece o limite de 5 minutos que antecedem e sucedem a jornada de trabalho para fins de apuração das horas extras.',
  'Jurisprudência',
  'legal',
  true,
  true
);

-- Súmulas TST - Adicional
INSERT INTO knowledge_base (title, content, category, agent_type, is_global, is_active)
VALUES (
  'Súmulas TST - Jornada, Férias e Salário (Seleção Ampliada)',
  'SÚMULAS DO TST - JORNADA, FÉRIAS E SALÁRIO

SÚMULA 85 - COMPENSAÇÃO DE JORNADA
I. A compensação de jornada de trabalho deve ser ajustada por acordo individual escrito, acordo coletivo ou convenção coletiva.
II. O acordo individual para compensação de horas é válido, salvo se houver norma coletiva em sentido contrário.
III. O mero não atendimento das exigências legais para a compensação de jornada, inclusive quando encetada mediante acordo tácito, não implica a repetição do pagamento das horas excedentes à jornada normal diária, se não dilatada a jornada máxima semanal, sendo devido apenas o respectivo adicional.
IV. A prestação de horas extras habituais descaracteriza o acordo de compensação de jornada. Nesta hipótese, as horas que ultrapassarem a jornada semanal normal deverão ser pagas como horas extraordinárias e, quanto àquelas destinadas à compensação, deverá ser pago a mais apenas o adicional por trabalho extraordinário.
V. As disposições contidas nesta súmula não se aplicam ao regime compensatório na modalidade "banco de horas", que somente pode ser instituído por negociação coletiva.
VI. Não é válido acordo de compensação de jornada em atividade insalubre, ainda que estipulado em norma coletiva, sem a necessária inspeção prévia e permissão da autoridade competente, na forma do art. 60 da CLT.

SÚMULA 101 - DIÁRIAS DE VIAGEM. SALÁRIO
Integram o salário, pelo seu valor total e para efeitos indenizatórios, as diárias de viagem que excedam a 50% (cinquenta por cento) do salário do empregado.

SÚMULA 110 - JORNADA DE TRABALHO. INTERVALO
No regime de revezamento, as horas trabalhadas em seguida ao repouso semanal de 24 horas, com prejuízo do intervalo mínimo de 11 horas consecutivas para descanso entre jornadas, devem ser remuneradas como extraordinárias, inclusive com o respectivo adicional.

SÚMULA 115 - HORAS EXTRAS. GRATIFICAÇÕES SEMESTRAIS
O valor das horas extras habituais integra a remuneração do trabalhador para o cálculo das gratificações semestrais.

SÚMULA 132 - ADICIONAL DE PERICULOSIDADE. INTEGRAÇÃO
I - O adicional de periculosidade, pago em caráter permanente, integra o cálculo de indenização e de horas extras.
II - Durante as horas de sobreaviso, o empregado não se encontra em condições de risco, razão pela qual é incabível a integração do adicional de periculosidade sobre as mencionadas horas.

SÚMULA 138 - FÉRIAS. EMPREGADO PRESO OU DESAPARECIDO
Em caso de ser ou ter sido o empregado preso ou estar desaparecido, não é possível o não pagamento, a suspensão ou a interrupção de suas férias.

SÚMULA 171 - FÉRIAS PROPORCIONAIS. CONTRATO DE TRABALHO. EXTINÇÃO
Salvo na hipótese de dispensa do empregado por justa causa, a extinção do contrato de trabalho sujeita o empregador ao pagamento da remuneração das férias proporcionais, ainda que incompleto o período aquisitivo de 12 (doze) meses.

SÚMULA 261 - FÉRIAS PROPORCIONAIS. PEDIDO DE DEMISSÃO. CONTRATO VIGENTE HÁ MENOS DE UM ANO
O empregado que se demite antes de completar 12 (doze) meses de serviço tem direito a férias proporcionais.

SÚMULA 265 - ADICIONAL NOTURNO. ALTERAÇÃO DE TURNO DE TRABALHO. POSSIBILIDADE DE SUPRESSÃO
A transferência para o período diurno de trabalho implica a perda do direito ao adicional noturno.

SÚMULA 291 - HORAS EXTRAS
A supressão total ou parcial, pelo empregador, de serviço suplementar prestado com habitualidade, durante pelo menos 1 (um) ano, assegura ao empregado o direito à indenização correspondente ao valor de 1 (um) mês das horas suprimidas, total ou parcialmente, para cada ano ou fração igual ou superior a seis meses de prestação de serviço acima da jornada normal.

SÚMULA 328 - FÉRIAS. TERÇO CONSTITUCIONAL
O pagamento das férias, integrais ou proporcionais, gozadas ou não, na vigência da CF/1988, sujeita-se ao acréscimo do terço previsto no respectivo art. 7º, XVII.

SÚMULA 354 - GORJETAS. NATUREZA JURÍDICA. REPERCUSSÕES
As gorjetas, cobradas pelo empregador na nota de serviço ou oferecidas espontaneamente pelos clientes, integram a remuneração do empregado, não servindo de base de cálculo para as parcelas de aviso-prévio, adicional noturno, horas extras e repouso semanal remunerado.',
  'Jurisprudência',
  'legal',
  true,
  true
);

-- Jurisprudências Vinculantes STF relacionadas a trabalho
INSERT INTO knowledge_base (title, content, category, agent_type, is_global, is_active)
VALUES (
  'Jurisprudências Vinculantes STF - Temas Trabalhistas',
  'JURISPRUDÊNCIAS VINCULANTES DO STF - TEMAS TRABALHISTAS

SÚMULA VINCULANTE 4
Salvo nos casos previstos na Constituição, o salário mínimo não pode ser usado como indexador de base de cálculo de vantagem de servidor público ou de empregado, nem ser substituído por decisão judicial.

SÚMULA VINCULANTE 6
Não viola a Constituição o estabelecimento de remuneração inferior ao salário mínimo para as praças prestadoras de serviço militar inicial.

SÚMULA VINCULANTE 15
O cálculo de gratificações e outras vantagens do servidor público não incide sobre o abono utilizado para se atingir o salário mínimo.

SÚMULA VINCULANTE 22
A Justiça do Trabalho é competente para processar e julgar as ações de indenização por danos morais e patrimoniais decorrentes de acidente de trabalho propostas por empregado contra empregador, inclusive aquelas que ainda não possuíam sentença de mérito em primeiro grau quando da promulgação da Emenda Constitucional nº 45/04.

SÚMULA VINCULANTE 53
A competência da Justiça do Trabalho prevista no art. 114, VIII, da Constituição Federal alcança a execução de ofício das contribuições previdenciárias relativas ao objeto da condenação constante das sentenças que proferir e acordos por ela homologados.

TESES DE REPERCUSSÃO GERAL IMPORTANTES:

RE 693.456 (Tema 531) - ABONO DE PERMANÊNCIA
O abono de permanência tem natureza jurídica de parcela remuneratória, não constituindo mera vantagem patrimonial.

RE 760.931 (Tema 725) - TERCEIRIZAÇÃO
O inadimplemento dos encargos trabalhistas dos empregados do contratado não transfere automaticamente ao Poder Público contratante a responsabilidade pelo seu pagamento, seja em caráter solidário ou subsidiário, nos termos do art. 71, § 1º, da Lei nº 8.666/93.

RE 958.252 (Tema 725) - TERCEIRIZAÇÃO ATIVIDADE-FIM
É lícita a terceirização ou qualquer outra forma de divisão do trabalho entre pessoas jurídicas distintas, independentemente do objeto social das empresas envolvidas, mantida a responsabilidade subsidiária da empresa contratante.

ADC 16 - RESPONSABILIDADE ESTADO TERCEIRIZAÇÃO
O art. 71 da Lei nº 8.666/93, ao dispor que a inadimplência do contratado, com referência aos encargos trabalhistas, fiscais e comerciais não transfere à Administração Pública a responsabilidade por seu pagamento, foi declarado constitucional pelo STF.

ADI 5938 - TRABALHO INSALUBRE GESTANTE E LACTANTE
É inconstitucional a expressão "quando apresentar atestado de saúde, emitido por médico de confiança da mulher, que recomende o afastamento" contida nos incisos II e III do art. 394-A da CLT, inserido pela Lei 13.467/2017.
CONSEQUÊNCIA: Gestantes e lactantes devem ser afastadas automaticamente de atividades insalubres, independentemente de atestado médico.',
  'Jurisprudência',
  'legal',
  true,
  true
);

-- CLT - Segurança e Medicina do Trabalho
INSERT INTO knowledge_base (title, content, category, agent_type, is_global, is_active)
VALUES (
  'CLT - Segurança e Medicina do Trabalho (Arts. 154-201)',
  'SEGURANÇA E MEDICINA DO TRABALHO - CLT

DISPOSIÇÕES GERAIS (Arts. 154-159)

Art. 154 - A observância, em todos os locais de trabalho, do disposto neste Capítulo, não desobriga as empresas do cumprimento de outras disposições que, com relação à matéria, sejam incluídas em códigos de obras ou regulamentos sanitários dos Estados ou Municípios em que se situem os respectivos estabelecimentos.

Art. 155 - Incumbe ao órgão de âmbito nacional competente em matéria de segurança e medicina do trabalho:
I - estabelecer, nos limites de sua competência, normas sobre a aplicação dos preceitos deste Capítulo;
II - coordenar, orientar, controlar e supervisionar a fiscalização e as demais atividades relacionadas com a segurança e a medicina do trabalho;
III - conhecer, em grau de recurso, das decisões proferidas pelos Delegados Regionais do Trabalho.

Art. 157 - Cabe às empresas:
I - cumprir e fazer cumprir as normas de segurança e medicina do trabalho;
II - instruir os empregados, através de ordens de serviço, quanto às precauções a tomar no sentido de evitar acidentes;
III - adotar as medidas que lhes sejam determinadas pelo órgão regional competente;
IV - facilitar o exercício da fiscalização pela autoridade competente.

Art. 158 - Cabe aos empregados:
I - observar as normas de segurança e medicina do trabalho;
II - colaborar com a empresa na aplicação dos dispositivos deste Capítulo.
Parágrafo único - Constitui ato faltoso do empregado a recusa injustificada:
a) à observância das instruções expedidas pelo empregador;
b) ao uso dos equipamentos de proteção individual fornecidos pela empresa.

EQUIPAMENTOS DE PROTEÇÃO INDIVIDUAL - EPI (Art. 166-167)

Art. 166 - A empresa é obrigada a fornecer aos empregados, gratuitamente, equipamento de proteção individual adequado ao risco e em perfeito estado de conservação e funcionamento, sempre que as medidas de ordem geral não ofereçam completa proteção contra os riscos de acidentes e danos à saúde dos empregados.

Art. 167 - O equipamento de proteção só poderá ser posto à venda ou utilizado com a indicação do Certificado de Aprovação do Ministério do Trabalho.

ATIVIDADES INSALUBRES OU PERIGOSAS (Arts. 189-197)

Art. 189 - Serão consideradas atividades ou operações insalubres aquelas que, por sua natureza, condições ou métodos de trabalho, exponham os empregados a agentes nocivos à saúde, acima dos limites de tolerância fixados em razão da natureza e da intensidade do agente e do tempo de exposição aos seus efeitos.

Art. 190 - O Ministério do Trabalho aprovará o quadro das atividades e operações insalubres e adotará normas sobre os critérios de caracterização da insalubridade, os limites de tolerância aos agentes agressivos.

Art. 191 - A eliminação ou a neutralização da insalubridade ocorrerá:
I - com a adoção de medidas que conservem o ambiente de trabalho dentro dos limites de tolerância;
II - com a utilização de equipamentos de proteção individual.

Art. 192 - O exercício de trabalho em condições insalubres, acima dos limites de tolerância estabelecidos pelo Ministério do Trabalho, assegura a percepção de adicional respectivamente de 40% (quarenta por cento), 20% (vinte por cento) e 10% (dez por cento) do salário-mínimo da região, segundo se classifiquem nos graus máximo, médio e mínimo.

Art. 193 - São consideradas atividades ou operações perigosas, na forma da regulamentação aprovada pelo Ministério do Trabalho e Emprego, aquelas que, por sua natureza ou métodos de trabalho, impliquem risco acentuado em virtude de exposição permanente do trabalhador a:
I - inflamáveis, explosivos ou energia elétrica;
II - roubos ou outras espécies de violência física nas atividades profissionais de segurança pessoal ou patrimonial;
III - (Vetado);
IV - energia elétrica;
V - motocicleta.
§1º - O trabalho em condições de periculosidade assegura ao empregado um adicional de 30% (trinta por cento) sobre o salário sem os acréscimos resultantes de gratificações, prêmios ou participações nos lucros da empresa.
§2º - O empregado poderá optar pelo adicional de insalubridade que porventura lhe seja devido.
§3º - Serão descontados ou compensados do adicional outros da mesma natureza eventualmente já concedidos ao vigilante por meio de acordo coletivo.
§4º - São também consideradas perigosas as atividades de trabalhador em motocicleta.',
  'CLT',
  'legal',
  true,
  true
);