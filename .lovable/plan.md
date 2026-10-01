# Fase 5B-1 — Etapa 0: diagnóstico da Segurança Psicológica (somente leitura)

Objetivo: mapear o que já existe de Segurança Psicológica no NR-1 antes de escrever qualquer código. Nenhum arquivo, tabela ou regra de acesso será alterado nesta etapa. Nada publicado.

## O que será levantado
1. **Classificação da tela atual** (/nr1/seguranca-psicologica, já no menu interno do NR-1): rotulada como (a) estática/placeholder, (b) informativa sem dados ou (c) já puxa dados de alguma tabela. Com a recomendação: evoluir no lugar, mantendo rota e menu (preferido), ou criar tela nova, com o motivo.
2. **Origem de cada número visível:** para cada card ou indicador da tela, dizer se vem de dados reais (qual tabela, quantos registros), se é ilustrativo (fixo no código) ou se não há dado. Se existir tabela com registros, o módulo evolui a partir dela; se não, nasce do zero.
3. **Cobertura do COPSOQ atual:** listar as perguntas e dimensões do questionário já cadastrado que tocam segurança psicológica (apoio social, insegurança, confiança, recompensas etc.), com o texto de cada item. A decisão entre escala própria (Edmondson, 7 itens) e reaproveitamento fica com vocês.
4. **Mapa de reuso, sem duplicar lógica sensível:** dizer o que pode ser reaproveitado: agregação com k=5 do diagnóstico, consentimento LGPD, exportação PDF/planilha do NR-1 e a correlação com o Clima (inclusive se ela já cobre dimensões de segurança psicológica ou se o módulo novo precisará se ligar a ela). Se não houver agregação reaproveitável, isso será dito claramente.
5. **Banco e servidor:** tabelas, funções e regras de acesso ligadas ao tema; o que fazem nr1-bem-estar-agent, check-security-alerts, nr1-questionario-publico e o agente Psi em relação a ele.
6. **Trava e papéis:** confirmar has_module('nr1') e como a tela se comporta para colaborador, gestor, RH, consultor e empresa sem NR-1 (código + abertura no navegador por papel).
7. **Prova de que foi só leitura:** contar as linhas de nr1_access_log, audit_logs e das tabelas de resposta antes e depois das aberturas no navegador e mostrar a diferença. Se abrir a tela gravar um registro de acesso automaticamente, isso será informado como achado (e o registro de teste fica identificado), em vez de omitido.

## Entrega
- Tabela "já existe / incompleto / precisa criar" para cada item do documento, mais a classificação da tela, a origem dos números, a cobertura do COPSOQ e o mapa de reuso.
- Proposta do plano de implementação da Fase 5B-1 para revisão, sem código.
- Confirmação de dados reais intactos (ciclos NR-1, Carlos, Josue, Marli, 18 logins) e contagens antes/depois.

## Detalhes técnicos
- Leitura de src/pages/nr1/Nr1SegPsi.tsx, Nr1Layout.tsx, ModuleGate, useNr1, nr1Privacy, funções em supabase/functions/ e consultas de leitura ao catálogo (tabelas, policies, funções nr1_*).
- Playwright só em modo leitura com sessões mintadas por papel.
