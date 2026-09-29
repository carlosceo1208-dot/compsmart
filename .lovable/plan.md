# Fase 4 — Diagnóstico de Maturidade do RH

## O que vai existir
1. **Página pública /maturidade** (site compsmart.ia.br, visual atual do site)
   - Hero "Seu RH opera em qual nível de maturidade?" + botão "Descobrir meu nível grátis".
   - Cards dos 4 papéis (nomes 2026), escada dos 5 níveis, "Como funciona" em 3 passos.
   - Mini-questionário: as 10 afirmações (1, 9, 10, 13, 17, 25, 30, 33, 37, 41), escala 1–5, sem login, resultado na hora (nível + frase). As respostas não são gravadas.
   - Depois do resultado: formulário nome, empresa, e-mail, porte + aceite LGPD obrigatório → "Quero o diagnóstico completo". Grava só o lead com o nível do teaser.
   - Rodapé discreto "Baseado nos fundamentos de Dave Ulrich" + menção LGPD. Celular e desktop.
2. **Ferramenta interna** (só super admin e consultor CompSmart; cliente não vê)
   - Criar diagnóstico: empresa + nome do projeto (rascunho → coletando → concluído).
   - Convidar RH: link único por e-mail convidado; o RH responde as afirmações do grupo RH/Ambos sem login. Link inválido/já usado → mensagem clara.
   - Registrar gestores: consultor lança respostas de cada gestor sem identificação (grupo Gestores/Ambos).
   - Progresso "RH: 8/48 · Gestores: 5/48" e aviso quando não finalizado.
   - Scorecard: média RH, média Gestores, gap, nível por dimensão, resumo por eixo, score global, dimensão mais forte e mais crítica, cores verde/amarelo/vermelho.
   - Radar de 12 pontas (RH x Gestores).
   - Relatório executivo para imprimir/PDF: textos fixos por nível + scores + gap + destaques + recomendações por dimensão crítica. Nunca mostra resposta individual de gestor.
   - Roadmap 90 dias: ações modelo para as 3 dimensões mais fracas.
3. **Leads da maturidade aparecem em /admin/leads** (somente leitura, origem "Maturidade"), como já é feito com a NR-1.

## Regras de cálculo
- Nota por dimensão = média das respostas 1–5; score global = média das 12 dimensões.
- Cortes: até 1,8 Reativo · até 2,6 Estruturado · até 3,4 Alinhado · até 4,2 Parceiro · acima Transformacional (limite inferior incluso no nível de cima; calibrar após o piloto).
- Gap = média Gestores − média RH por dimensão; dimensão sem respostas de um grupo mostra "sem dados", nunca zero.
- As 48 afirmações entram exatamente como enviadas (texto, número e grupo).

## Fora do escopo
- Sem IA nesta fase (recomendações e roadmap são textos modelo); não é módulo vendido; não mexe em pagamentos, checkout, dashboard do cliente nem em Carlos/Josue/Marli.
- Não publicar até você revisar.

## Validação
- `bun run ci` limpo; Playwright 1280 e 390 na landing e no teaser; sem aceite LGPD o lead não é salvo.
- Fluxo interno completo com dados fictícios e scorecard conferido contra cálculo manual; radar e impressão do relatório.
- Segurança: visitante e colaborador não acessam a ferramenta; token inválido recusado; consultor sem projeto na empresa não vê nada. Dados de teste apagados ao final.
- roadmap.md: registrar GATE de varredura de segurança completa antes do relançamento comercial.

## Detalhes técnicos
- Tabelas (com GRANT + RLS): `maturidade_questionario` (seed 48, leitura authenticated), `maturidade_diagnosticos` (root_company_id), `maturidade_respostas` (respondente_tipo rh/gestor, `respondente_id` nulo para gestor, mais `lote_gestor` numérico só para agrupar sem identificar), `maturidade_convidados` (token aleatório, expira em 30 dias, status), `maturidade_leads`.
- Acesso interno: função `maturidade_pode_gerir(company)` = super_admin OU consultor com projeto ativo do RH Service naquela empresa (regra já usada no RH Service).
- Público: RPC SECURITY DEFINER `submit_maturidade_lead` (valida e-mail/tamanhos, LGPD obrigatório, throttle), `maturidade_convite_questoes(token)` e `maturidade_convite_responder(token, respostas)` — anônimo nunca lê tabelas.
- Scorecard calculado no cliente a partir de uma RPC agregada que devolve só médias por dimensão/grupo (nunca linhas de gestores). Funções puras de cálculo em `src/lib/maturidade.ts` com testes vitest.
- Radar com recharts (já no projeto); relatório via `window.print` com CSS de impressão.
- Rotas: `/maturidade` (público, entrada em seoRoutes.ts), `/maturidade/responder/:token` (público, noindex), `/consultoria/maturidade` e `/consultoria/maturidade/:id` (internas). Regra nova em AGENTS.md.
