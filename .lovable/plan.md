# Fase 5B-1 — Etapa 0: diagnóstico da Segurança Psicológica (somente leitura)

Objetivo: mapear o que já existe de Segurança Psicológica no NR-1 antes de escrever qualquer código. Nenhum arquivo, tabela ou regra de acesso será alterado nesta etapa. Nada publicado.

## O que será levantado
1. **Telas e rotas:** a tela atual de Segurança Psicológica (/nr1/seguranca-psicologica, já no menu interno do NR-1), o que ela mostra hoje, de onde vêm os números e se há dados reais ou ilustrativos.
2. **Questionário:** se existe pergunta própria (Edmondson ou outra) ou se reaproveita itens do COPSOQ; se usa o mesmo consentimento LGPD do diagnóstico.
3. **Banco:** tabelas, funções e regras de acesso ligadas ao tema (respostas, agregação, k=5, auditoria em nr1_access_log).
4. **Agentes e funções do servidor:** nr1-bem-estar-agent, check-security-alerts, nr1-questionario-publico e o agente Psi — o que cada um faz em relação ao tema.
5. **Trava:** confirmar que a tela fica atrás de has_module('nr1') e como se comporta para colaborador, gestor, RH, consultor e empresa sem NR-1 (leitura do código e uma abertura no navegador por papel, sem gravar nada).
6. **Exportação e correlação:** se já existe relatório PDF/planilha e cruzamento com Clima para este tema.

## Entrega
- Tabela "já existe / incompleto / precisa criar" para cada item do documento (questionário, dashboard, alertas por área, relatório, correlação com Clima, regras de acesso por papel).
- Proposta do plano de implementação da Fase 5B-1 para você revisar, sem código.
- Confirmação de dados reais intactos (consulta só de leitura).

## Detalhes técnicos
- Leitura de src/pages/nr1/Nr1SegPsi.tsx, Nr1Layout.tsx, ModuleGate, useNr1, nr1Privacy, funções em supabase/functions/ e consultas de leitura ao catálogo (tabelas, policies, funções nr1_*).
- Playwright só em modo leitura com sessões mintadas por papel.
