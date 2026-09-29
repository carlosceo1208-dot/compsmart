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
- Nível único para teaser e scorecard (mesma regra, nunca duplicada): até 1,8 Reativo · até 2,6 Estruturado · até 3,4 Alinhado · até 4,2 Parceiro · acima de 4,2 Transformacional (o valor do limite fica no nível de baixo; calibrar após o piloto).
- Gap = média Gestores − média RH por dimensão; dimensão sem respostas de um grupo mostra "sem dados", nunca zero.
- As 48 afirmações entram exatamente como enviadas (texto, número e grupo).

## Ajustes combinados antes do build
1. Nível calculado por uma única regra, testada com 1,8 / 2,6 / 3,4 / 4,2 / 4,21.
2. Quem responde vê só o seu grupo: convite do RH mostra RH + Ambos; lançamento de gestores mostra Gestores + Ambos. O RH nunca vê afirmações de gestores e vice-versa.
3. Gestores cadastrados um a um sem nome/e-mail ("Gestor 1", "Gestor 2"). Progresso "Gestores: 2/5 respondidos" (conta só gestores completos). Relatório só usa média do grupo.
4. Proteção contra abuso: lead limitado a 5 por hora por IP, e-mail e tamanhos validados, aceite LGPD gravado com data/hora e versão do texto; sem aceite não salva. Link do RH com limite de tentativas por link e por IP contra adivinhação.
5. As médias do scorecard só saem para quem pode gerir aquele diagnóstico; usuário logado sem projeto na empresa não recebe nada.
6. Relatório com cabeçalho (empresa, data, score global, nível) e frase fixa explicando o gap: "compara a autoavaliação do RH com a percepção dos gestores (percepção cruzada)". Nunca mostra resposta individual de gestor.

## Fora do escopo
- Sem IA nesta fase (recomendações e roadmap são textos modelo); não é módulo vendido; não mexe em pagamentos, checkout, dashboard do cliente nem em Carlos/Josue/Marli.
- Não publicar até você revisar.

## Validação
- `bun run ci` limpo; Playwright 1280 e 390 na landing e no teaser; sem aceite LGPD o lead não é salvo.
- Fluxo interno completo com dados fictícios e scorecard conferido contra cálculo manual; radar e impressão do relatório.
- Segurança: visitante e colaborador não acessam a ferramenta; token inválido recusado; consultor sem projeto na empresa não vê nada. Dados de teste apagados ao final.
- roadmap.md: registrar GATE de varredura de segurança completa antes do relançamento comercial.

## Detalhes técnicos
- Tabelas (com GRANT + RLS): `maturidade_questionario` (seed 48, leitura authenticated), `maturidade_diagnosticos` (root_company_id), `maturidade_gestores` (diagnostico_id, rótulo "Gestor N", completo bool — sem nome/e-mail), `maturidade_respostas` (respondente_tipo rh/gestor, `gestor_id` só para agrupar, nunca exposto), `maturidade_convidados` (token aleatório, expira em 30 dias, status, tentativas), `maturidade_leads` (consentimento_em, consentimento_versao, ip_hash).
- Acesso interno: `maturidade_pode_gerir(company)` = super_admin OU consultor com projeto ativo do RH Service naquela empresa.
- Público: RPCs SECURITY DEFINER `submit_maturidade_lead` (5/h por IP via rate limit existente, validação, LGPD com data+versão), `maturidade_convite_questoes(token)` (filtra rh+ambos) e `maturidade_convite_responder(token, respostas)` (limite de tentativas por token/IP) — anônimo nunca lê tabelas.
- Lançamento de gestores pelo consultor filtra gestores+ambos no servidor.
- `maturidade_scorecard(diagnostico)` exige `maturidade_pode_gerir`, devolve só médias por dimensão/grupo e contagens. `nivelDoScore` e demais cálculos puros em `src/lib/maturidade.ts` com vitest (limites exatos).
- Radar com recharts (já no projeto); relatório via `window.print` com CSS de impressão.
- Rotas: `/maturidade` (público, entrada em seoRoutes.ts), `/maturidade/responder/:token` (público, noindex), `/consultoria/maturidade` e `/consultoria/maturidade/:id` (internas). Regra nova em AGENTS.md.
