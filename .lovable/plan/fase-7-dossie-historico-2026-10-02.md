# Dossiê — Fase 7 (Histórico do NR-1) — 2026-10-02

## D2 — inversão corrigida
O comparador antigo (Visão Geral) usava o risco bruto e chamava de "Evolução positiva" uma subida de risco. Agora: nota de saúde subindo = evolução (↑ verde), caindo = piora (↓), ±0,5 = estável; dimensões também na nota de saúde.

## Conferência (empresas de teste [TESTE] Hist A com NR-1 e Hist B sem NR-1, apagadas)
- 1280/390: ciclos com 5 e 6 respostas com selo; ciclo com 4 = "Dados insuficientes" e "não comparável" no seletor.
- Base 2025 (saúde 40) → 2026 (50): "Evolução positiva +10,0". Base 2026 (50) → jun 2026 (42): "Piora -8,0".
- Ciclo escolhido num seletor fica desabilitado no outro. Tabela rola na horizontal em 390px.
- Filtro: início 2026-01-01 esconde 2025; fim 2026-05-01 esconde agosto.
- Visão Geral sem comparador, com "Ver histórico completo".
- Banco (desfeito): RH de A vê 4 ciclos de A e 0 de B; RH de empresa sem NR-1 vê 0 da própria e 0 de A.
- PDF e planilha abertos: período, fórmula, limites do selo e k=5 no topo; sem nomes; ciclo de 4 sem nota.
- Achado: o arquivo DejaVuSans-Bold.ttf da raiz era uma página HTML, não uma fonte — trocado pela DejaVu Sans Bold real em src/assets/fonts.

## Contagens após limpeza
Iguais às de antes do teste: acessos 25 registros na tabela (sem acréscimo), 2 auditorias, 9 check-ups, 2 diagnósticos, Q1 2026 = 49,93.

## Código
bun run ci: 0 erros, 65 testes, build ok. Nada publicado.
