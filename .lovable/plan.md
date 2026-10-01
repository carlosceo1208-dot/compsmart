# Fase 5B-3 — Etapa 0: Diagnóstico da etapa "Acompanhar" (Minha Jornada + Check up Semanal)

Somente leitura: nada é alterado, gravado ou publicado. Também não serão criados logins nem empresas de teste.

## 1. Contagens iniciais (com valores)
Antes de qualquer leitura, registrar: nr1_access_log (3), audit_logs (2), nr1_diagnostico_respostas (440), nr1_segpsi_respostas (0), nr1_vitalidade_respostas (0), logins (18), além de nr1_jornadas, nr1_jornada_mensagens e nr1_checkins_semanais.

## 2. Para cada card (Minha Jornada e Check up Semanal)
- Localizar a rota, o item de menu e a tela. Classificar a tela como (a) estática, (b) informativa sem dados ou (c) já puxa dados.
- Origem de cada número visível: dado real (qual tabela e quantos registros), fixo no código ou sem dado.
- O que já existe no banco e no servidor: tabelas (nr1_jornadas, nr1_jornada_mensagens, nr1_checkins_semanais), funções, funções do servidor, regras de acesso, registros em nr1_access_log.
- Recomendação: evoluir no lugar (preferido, mantendo rota e menu) ou criar do zero, com motivo.

## 3. Mapa de reuso (por peça: reaproveitável / precisa adaptação / precisa criar)
Trava has_module('nr1'); agregação k=5 no servidor (padrão nr1_*_agregar); envio anônimo atômico + consentimento LGPD; score 0–100, selo de status e "dados insuficientes"; exportação só agregada; resultado individual uma única vez; correlação condicional com o Clima.

## 4. Trava e papéis
- Confirmar no código e nas regras do banco que a área interna continua travada por has_module('nr1'). Se não estiver, isso é achado bloqueador e a Etapa 0 para aí.
- Analisar, lendo o código e as regras de acesso, o comportamento para: colaborador, gestor com e sem grupo, RH/admin, consultor da mesma empresa, super admin e empresa sem NR-1. Pela regra já registrada, Minha Jornada e Check up só podem ser lidos pelo próprio colaborador; conferir se as regras atuais cumprem isso.

## 5. Encerramento
- Repetir as contagens. Diferença esperada: 0. Qualquer registro automático é apontado como achado.
- Conferir os dados reais: ciclo 49,93 "Moderado", ciclo sem nota, Carlos, Josué, os 2 registros da Marli, 18 logins, 440 respostas.

## Entregável
Documento em Arquivos (fase-5b3-acompanhar/diagnostico-etapa0.md) com:
- tabela "já existe / incompleto / precisa criar" para cada card;
- classificação das telas, origem dos números, mapa de reuso e recomendação;
- contagens antes/depois e confirmação da trava por papel;
- lista de decisões pendentes para o CEO: escopo de cada card, escala do check-up, resultado individual e unidade de agregação.

Nada publicado. A implementação só começa após a sua revisão.

Pendência da fase anterior, que continua aberta: conferir na tela o convite para contratar o Clima.
