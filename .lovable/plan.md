# Agente Talent visível na Triagem (lote + por card)

## O que muda para o RH
- **Topo da aba Triagem**, ao lado do seletor de vaga: botão **"Analisar currículos (N)"**. Só fica ativo se houver candidatos da vaga ainda sem análise e com currículo.
- Ao clicar: confirmação "Analisar N currículos? Consome créditos de IA." com **Confirmar**. O botão trava assim que é clicado (sem chamada dupla).
- Processamento em fila, **no máximo 2 ao mesmo tempo**. No topo: "Analisando 3/12" com barra de progresso.
- Em cada card, faixa de status: *Analisando…* → nota colorida (80+ verde, 60–79 azul, abaixo de 60 âmbar) ou *Falhou* com **"Tentar novamente"** só daquele card. Uma falha não para a fila.
- **Botão no card** (ícone de faísca):
  - Sem análise: **"Analisar"** roda na hora, sem abrir o painel lateral.
  - Com análise: **"Reanalisar"**, com confirmação ("Substitui a análise anterior e consome créditos"). A reanálise é registrada no Histórico como evento do agente ("Reanálise do currículo: nota 62 → 71").
- Mantido: clicar no nome abre o painel (Análise/Histórico); o botão "Analisar currículo" do painel continua; **o agente nunca move ninguém de etapa**.
- Falta de créditos (402) ou limite (429) **pausa a fila inteira** e mostra o aviso; os pendentes voltam a ficar disponíveis.

## Quem vê
- Botões aparecem e funcionam só para **admin e gestor de RH** da empresa com o módulo Seleção contratado. Outros papéis e outras empresas não veem nem conseguem disparar.

## Detalhes técnicos
- `useTriagem`/`TriagemKanban`: nova fila no cliente (concorrência 2, estado por candidatura `fila|analisando|ok|erro`), reutiliza `useAnalisarCurriculo` via `mutateAsync`; invalida a query após cada item. Pendentes = `analise_talent IS NULL` e `curriculo_url` presente.
- Visibilidade: `useCurrentUserRole` (isAdmin/isHR) + acesso ao módulo talent já usado pela página.
- `agent-talent` (acao analisar): **adicionar checagem de papel no servidor** (admin ou hr_manager, via `has_role`), além de JWT, módulo e RLS já existentes. Hoje só verifica módulo.
- Reanálise: quando já existia `analise_talent`, a função grava (com service role, caminho protegido) uma linha em `candidato_historico` com `etapa_anterior = etapa_nova = etapa atual`, `origem = 'agente'`, motivo com nota anterior → nova. Primeiro confirmo as restrições da tabela (ex.: checagem que proíba etapa igual); se houver, migration incremental mínima só para permitir esse tipo de evento — sem tocar nos 86 achados antigos.
- Anonimização LGPD e logs só com tamanhos/contagens ficam como estão.

## Validação
- `bun run ci`; Playwright 1280 e 390.
- Lote com 3 candidaturas descartáveis (2 PDFs legíveis, 1 só-imagem) numa vaga de teste: contagem certa na confirmação, progresso correto, a de imagem mostra "Tentar novamente", as outras recebem a nota. Botão desativa sem pendentes; duplo clique no Confirmar não gera chamada extra (conferir nos registros do serviço de IA).
- Individual pelo card e pelo painel; reanálise aparece no Histórico.
- Papel sem permissão e outra empresa: botão oculto e função responde 403 (simulação com desfazimento, como no teste anterior).
- Carlos não é analisado automaticamente sem sua confirmação; fictícios de teste removidos só depois do teste, com sua autorização.
- Publicar e conferir no site oficial com Ctrl+Shift+R.
