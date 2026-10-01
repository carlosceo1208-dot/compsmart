# Fase 5B-2 — Etapa 0: Diagnóstico do Vitalidade (somente leitura)

Nada é alterado, gravado ou publicado. Ao final entrego um diagnóstico no mesmo formato da Etapa 0 da Segurança Psicológica e paramos para as 4 decisões pendentes.

## O que será verificado
1. **Tela atual** (/nr1/vitalidade, item "Vitalidade" em Mais recursos): classificar como placeholder, informativa sem dados ou com dados reais; recomendar evoluir no lugar (preferido) ou recriar, com motivo.
2. **Origem de cada número visível**: dado real (tabela + quantidade de registros), fixo no código, ou sem dado.
3. **Cobertura do COPSOQ**: listar, com o texto de cada pergunta, os itens e dimensões que tratam de energia, fadiga, recuperação, satisfação com a vida, equilíbrio vida-trabalho e sono. Sem escolher a escala ainda.
4. **Mapa de reuso da 5B-1**: agregação k=5, consentimento LGPD, envio anônimo atômico com o COPSOQ, exportação PDF/planilha, correlação com Clima, trava do NR-1. Para cada item: reaproveitável, precisa de adaptação ou precisa criar.
5. **Banco e servidor**: tabelas, funções, regras de acesso e registros de acesso já ligados ao tema.
6. **Trava e papéis**: código e abertura no navegador como colaborador, gestor (com e sem grupo), RH, consultor e empresa sem NR-1, sem gravar nada.
7. **Prova de leitura**: contagens antes/depois de registros de acesso, auditoria, respostas do diagnóstico, respostas da Segurança Psicológica e logins; diferença esperada 0. Qualquer registro automático de acesso é apontado como achado.

## Entregável
- Documento em Arquivos com a tabela "já existe / incompleto / precisa criar", a origem dos números, os itens do COPSOQ citados e a recomendação de caminho.
- Evidência para as 4 decisões: escala, dimensões, resultado do colaborador e unidade de agregação.
- Dados reais conferidos: ciclo 49,93 "Moderado", Carlos, Josué, 2 registros da Marli, 18 logins, 440 respostas.

## Detalhes técnicos
- Só leitura de arquivos (Nr1Vitalidade.tsx, Nr1SegPsi.tsx, nr1SegPsi.ts, nr1Privacy.ts, função pública do questionário, migrações da SegPsi) e consultas SELECT.
- Para abrir no navegador por papel, uso sessões existentes sem criar usuários nem vínculos; o que exigir gravação fica documentado como "não testável sem escrita".
- A implementação (tabela nova, função de agregação, telas, exportações) só começa depois que as decisões forem aprovadas, em um plano separado.
