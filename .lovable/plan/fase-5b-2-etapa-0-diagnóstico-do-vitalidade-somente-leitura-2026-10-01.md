# Fase 5B-2 — Etapa 0: Diagnóstico do Vitalidade (somente leitura)

Nada é alterado, gravado ou publicado. Ao final entrego um diagnóstico no mesmo formato da Etapa 0 da Segurança Psicológica e paramos para as decisões pendentes.

## O que será verificado
1. **Tela atual** (/nr1/vitalidade, item "Vitalidade" em Mais recursos): classificar como placeholder, informativa sem dados ou com dados reais; recomendar evoluir no lugar (preferido) ou recriar, com motivo.
2. **Origem de cada número visível**: dado real (tabela + quantidade de registros), fixo no código, ou sem dado.
3. **Cobertura do COPSOQ, com lacunas declaradas**: listar, com o texto de cada pergunta, os itens que tratam de energia, fadiga, recuperação, satisfação com a vida, equilíbrio vida-trabalho e sono. Declarar explicitamente cada lacuna; onde não houver cobertura, escrever "sem item" (ex.: "sono: sem item"; "recuperação: sem item direto"). Sem escolher a escala ainda.
4. **Mapa de reuso da 5B-1**, classificando cada peça como reaproveitável, precisa de adaptação ou precisa criar:
   - Peças técnicas: agregação k=5, consentimento LGPD, envio anônimo atômico, exportação PDF/planilha, correlação com Clima, trava do NR-1.
   - Padrões de tela: score global 0–100, selo Saudável/Atenção/Crítico, distribuição das respostas, alertas por grupo, rótulo "Não avaliada nesta escala — consulte o diagnóstico COPSOQ" e resultado individual só na tela final.
   - Consequência: resultado do colaborador e unidade de agregação ficam resolvidos por herança da 5B-1; restam escala e dimensões para decidir com evidência.
5. **Banco e servidor**: tabelas, funções, regras de acesso e registros de acesso já ligados ao tema.
6. **Trava e papéis**: confirmar que a trava do NR-1 está ativa na área interna, inclusive em /nr1/vitalidade (fechada na 5B-1). Se não estiver, registro como achado bloqueador e paro a Etapa 0 ali. Depois, comportamento para colaborador, gestor (com e sem grupo), RH, consultor e empresa sem NR-1, sem gravar nada.
7. **Prova de leitura com valores nas duas pontas**, no formato: acessos X → X, auditoria Y → Y, respostas do diagnóstico 440 → 440, respostas da SegPsi 0 → 0, logins 18 → 18. Qualquer registro automático de acesso é apontado como achado.

## Entregável
- Documento em Arquivos com a tabela "já existe / incompleto / precisa criar", a origem dos números, os itens do COPSOQ citados e as lacunas, e a recomendação de caminho.
- Classificação de reuso por peça, incluindo os padrões de tela.
- Trava confirmada ativa ou declarada como bloqueador.
- Contagens com valores antes/depois.
- Dados reais conferidos: ciclo 49,93 "Moderado", Carlos, Josué, 2 registros da Marli, 18 logins, 440 respostas.

## Detalhes técnicos
- Só leitura de arquivos (Nr1Vitalidade.tsx, Nr1SegPsi.tsx, nr1SegPsi.ts, nr1Privacy.ts, App.tsx, Nr1Layout.tsx, função pública do questionário, migrações da SegPsi) e consultas SELECT.
- Para abrir no navegador por papel, uso sessões existentes sem criar usuários nem vínculos; o que exigir gravação fica documentado como "não testável sem escrita".
- A implementação (tabela nova, função de agregação, telas, exportações) só começa depois que as decisões de escala e dimensões forem aprovadas, em um plano separado.
