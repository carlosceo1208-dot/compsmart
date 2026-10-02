# Fase 9 — Gestão de Terceiros (PGR) — Dossiê (2026-10-02)

## Decisões
- Escopo simples (D1): cadastro + grau de risco + PGR anexado + Relatório de Conformidade. Terceiro nunca acessa a plataforma.
- Regras do relatório mantidas por simplicidade (Conformidade geral 100/70/0% para válido/vencendo/vencido; rodapé "Validade: 30 dias"); revisão futura se o mercado pedir.
- Link do PGR: assinado, 60 s.
- Contrato de tipagem fechado: tipo Terceiro declara grau_risco, emergencia_nome, emergencia_telefone, emergencia_email, contrato_inicio; o "as any" do envio saiu. Colunas já existiam (sem migração de dados).
- Acesso: nr1_terceiros_pode_gerir (admin/RH da empresa ou consultor dono de projeto ativo, sempre com has_module nr1) nas duas tabelas e no bucket nr1-pgr-docs. Excluir terceiro só admin; excluir PGR admin/RH; ambos com has_module.
- Relatório com a mesma fonte embutida das Fases 7/8 (aplicarFonteUnicode / DejaVu); ficha ganhou grau de risco e início do contrato.
- Ajuste pontual: janela de Terceiros passou a mostrar a trava de módulo (ModuleGate nr1) para empresa sem NR-1 — antes abria a lista vazia.

## Validação (empresas temporárias, apagadas)
- Navegação NR-1 → Mais recursos → Gestão de Terceiros em 1280 e 390: estado vazio correto, sem erro.
- Cadastro com os 5 campos → recarregar: voltam iguais. Edição (grau 3→4, emergência nome/telefone/e-mail, início do contrato) → recarregar: voltam editados.
- CNPJ duplicado: bloqueado ("CNPJ já cadastrado para esta empresa.").
- PGR anexado; link assinado abre (200, PDF) e após 66 s falha (400, expirado).
- Relatório aberto: acentos corretos, DejaVu embutida, checklist 5/5 Conforme, status "PGR válido", grau 4 e início 15/04/2026. O texto atual do relatório não usa o símbolo "≤" (nada a conferir nesse ponto).
- Acesso: admin 1/1/link ok; RH 1/1/link ok; consultor sem projeto 0/0/link negado; consultor com projeto ativo 1/1/link ok; outra empresa sem NR-1 0/0/link negado + trava na tela (1280/390); sem login 0/0/negado.
- Linha de base depois: 25 · 2 · 440/0/0 · 9 · 190 · 2 · Q1 2026 = 49,93 (10 respondentes); terceiros/PGR/arquivos de teste = 0.
- bun run ci limpo.

## Publicação (2026-10-02)
- Publicação autorizada pelo CEO e executada em https://www.compsmart.ia.br.
- Pontos de honestidade registrados (não bloqueiam):
  1. Fonte do relatório validada por acentos; símbolos especiais ("≤", "≥", "−") cobertos pela mesma fonte embutida das Fases 7/8 — o texto gerado não continha "≤", então esse caso específico ficou sem o que conferir.
  2. Três contas de teste inativas (teste.fase9.*), sem empresa e sem papel — mesmo caso das Fases 7/8; mantidas inativas como item conhecido; remoção pela gestão de usuários do backend pode ser tentada em rodada futura.
- Estado do projeto: Fases 6, 7 e 8 fechadas; Fase 9 publicada.
