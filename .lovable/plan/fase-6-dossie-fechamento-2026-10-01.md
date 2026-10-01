# Dossiê — Fase 6 (Inteligência NR-1), fechamento antes de publicar — 2026-10-01

## A9 aprovado
A9 aprovado — Diagnóstico Q1 2026 passa de Moderado para Crítico por padronização do selo único; conversão 100 − risco exibida nas telas de Diagnóstico, Matriz de Risco e Visão Geral.
- Antes (site publicado): "Nível de Risco Moderado"; dimensões Baixo/Moderado/Alto.
- Depois (pré-visualização): "Crítico · saúde 50,1" com dica e rodapé "Nota de saúde = 100 − risco psicossocial"; dimensões no mesmo selo. Conferido em 1280px e 390px.
- Matriz de Risco: mostra o selo do diagnóstico e o rodapé; a classificação S×P de cada fator continua a da matriz do PGR (escala própria, 1–25), com aviso na tela de que é separada do selo de saúde.

## Travas de papel/empresa (teste no banco, desfeito no final)
RH da própria empresa com NR-1: acesso ok, unidade com 5 visível, unidade com 4 oculta (1 recorte oculto), saúde 50,1, sem 9Box (Potencial não contratado), correlação Clima 0 linhas (Clima não contratado), lê o próprio diagnóstico. RH chamando outra empresa: negado. RH de empresa sem NR-1: negado na própria e na outra; lê 0 diagnósticos da outra empresa.

## Assistentes (A5)
Teste src/test/nr1-assistentes-trava.test.ts (6 casos): os três assistentes conferem has_module('nr1') e respondem 403; nenhum lê 9Box, salário, Clima ou as funções de cruzamento. Chamada real sem login: 401 nos três.

## Exportações abertas
PDF e planilha baixados e abertos. Topo: período, diagnóstico, "13 recorte(s) oculto(s) por ter menos de 5 pessoas (k=5)", nota de método (fórmula 100 − risco, limites do selo, k=5, fator 0,5, mensal × 13,33, risco da empresa herdado por unidade). Nenhuma linha com menos de 5 pessoas, nenhum nome. Correções feitas: o aviso de recortes ocultos foi para o topo (antes ficava no fim do PDF e faltava na planilha); símbolos "−" e "≥" saíam errados na fonte do PDF e foram trocados por "-" e ">="; a planilha sem unidades visíveis agora traz a nota de método e não mostra "NaN".

## Avisos de segurança
- Aceito e justificado: nr1_inteligencia_unidades e nr1_clima_correlacao "podem ser executadas por usuário logado" — conferem papel, empresa e módulo antes de devolver números, devolvem só agregados com k=5 e gravam recusas. Mesmo padrão já aceito no NR-1.
- Scan de 2026-10-01 22:10 UTC: 1 aviso informativo, cbo_codes legível por qualquer usuário logado (catálogo público de códigos de cargo, sem dado pessoal) — não é da Fase 6.

## Limitações documentadas
- O diagnóstico é anônimo e não separado por unidade; enquanto não houver diagnóstico por unidade, o cruzamento por unidade usa o risco da empresa (está na nota de método da tela e das exportações).
- "Ciclo 2026" com 1 resposta: sem selo nem lista — correto pelo k=5; a Inteligência só acende com 5 ou mais respostas.

## Contagens
3 acessos à Inteligência gerados pela conferência automática (22:08–22:09 UTC) foram removidos. Linha de base: 4 acessos, 9 check-ups, 2 leads, Q1 2026 = 49,93.

## Código
bun run ci: 0 erros, 60 testes passando, build ok. Nada publicado.
