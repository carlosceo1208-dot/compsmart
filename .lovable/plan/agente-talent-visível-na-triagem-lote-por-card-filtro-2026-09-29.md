# Agente Talent visível na Triagem (lote + por card + filtro)

## O que muda para o RH
- **Topo da aba Triagem**, ao lado do seletor de vaga:
  - Filtro **Todos | Com análise (N) | Sem análise (N)**, padrão "Todos", guardado no endereço (`?analise=com|sem`). Só muda o que aparece na tela.
  - Botão **"Analisar currículos (N)"**: N conta sempre os pendentes da vaga, seja qual for o filtro. Pendente = sem análise, com currículo e fora de Arquivado. Sem pendentes, o botão fica desativado.
- Ao clicar no botão: confirmação "Analisar N currículos? Consome créditos de IA." com **Confirmar**. O botão trava no primeiro clique, então não há chamadas duplicadas.
- **Fila:** no máximo 2 ao mesmo tempo, começando por quem está há mais tempo na etapa. No topo aparece "Analisando 3/12" com uma barra de progresso.
- **Status em cada card:** *Na fila* → *Analisando…* → nota colorida (80+ verde, 60–79 azul, abaixo de 60 âmbar) ou *Falhou* com **"Tentar novamente"** só naquele card. Uma falha não para a fila.
- **Análise demorada (mais de 60 s):** o card mostra "Demorando mais que o normal", mas **continua ocupando sua vaga na fila**. A fila só avança quando uma das 2 análises termina, então nunca há mais de 2 pedidos ao mesmo tempo. O pedido não é cancelado, porque cancelar jogaria fora uma análise já paga.
- **PDF acima de 10 MB:** esse card é pulado com um aviso e a fila continua. Hoje o envio já limita a 5 MB, então isso só protege contra arquivos antigos.
- **Créditos esgotados (402) ou excesso de pedidos (429):** a fila inteira pausa e aparece um aviso. Os que estavam na fila e os que estavam em análise voltam para **"Tentar novamente"**. Nada é reenviado automaticamente. Se uma análise que já estava em andamento terminar bem, a nota dela é mantida.
- **Trocar de vaga durante a fila:** as análises em andamento terminam e são salvas, e os status continuam valendo ao voltar para a vaga. As que ainda estavam só na fila não começam.
- **Trocar de empresa:** a fila some da tela sem cancelar o que já foi enviado. Nenhum status de uma empresa aparece na outra.
- **Fim do lote:** resumo no topo "Concluído: X analisados, Y falharam, Z sem texto extraível".
- **Botão no card** (ícone de faísca, rótulo acessível "Analisar currículo de {nome}"):
  - Sem análise: **"Analisar"** roda na hora, sem abrir o painel lateral.
  - Com análise: **"Reanalisar"**, com confirmação ("Substitui a análise anterior e consome créditos"). O Histórico registra "Reanálise do currículo: nota X → Y", com origem Agente. A etapa e o tempo na etapa não mudam.
  - Sem currículo: não mostra o botão, só a dica "Sem currículo para analisar". Arquivados também não têm o botão e não entram no lote.
- **Continua como está:** clicar no nome abre o painel (Análise/Histórico), o botão "Analisar currículo" do painel continua lá e **o agente nunca move ninguém de etapa**.

## Quem vê
- Só **admin e gestor de RH da própria empresa**, com o módulo Seleção contratado. Os demais não veem os botões. Se alguém tentar disparar mesmo assim, a resposta é "Sem permissão para analisar currículos".

## Detalhes técnicos
- **Passo 0:** ler as restrições e gatilhos de `candidato_historico`. Se algo proibir `etapa_anterior = etapa_nova`, criar uma migration incremental aditiva que libere só os eventos de reanálise, sem tocar em registros antigos e sem mexer nos 86 achados antigos.
- **Hook de fila** (`useTriagem`): um `Map<candidaturaId, {status, erro}>` estável, com chave por `activeCompanyId`, que não depende da ordem da lista. A invalidação após cada item não apaga os status. O limite de 2 pedidos ao mesmo tempo é rígido: uma vaga só é liberada quando a promise termina. Ordem `etapa_desde ASC`. Em 402/429, a pausa esvazia a fila, marca os itens em análise como erro manual e não reenvia nada. Sem aborto por timer; o aviso dos 60 s é só visual. Trocar de vaga para a fila, e trocar de empresa descarta o Map e ignora respostas que chegarem depois. Os contadores do resumo usam o código `pdf_sem_texto` para "sem texto extraível".
- **`agent-talent` (analisar):** checar `has_role` admin/hr_manager e confirmar que a empresa do usuário (`get_user_root_company_id_strict`) é a mesma da candidatura, com 403 claro. Mantém JWT, módulo, RLS, anonimização LGPD e registros só com tamanhos. Checar o tamanho do arquivo antes de baixar (>10 MB retorna 413, código `pdf_grande`). Na reanálise, inserir o evento no histórico com service role, sem atualizar `etapa_desde`.
- **Acessibilidade:** `role="progressbar"` com `aria-valuenow/min/max`, status dos cards em `aria-live="polite"` e `aria-label` nos botões.

## Validação
- `bun run ci`; Playwright em 1280 e 390.
- Lote com 3 candidaturas descartáveis (2 PDFs legíveis e 1 só com imagem) numa vaga de teste: contagem certa na confirmação, progresso correto, o PDF de imagem mostra "Tentar novamente" e os outros recebem nota. Duplo clique em Confirmar não gera chamada extra (conferido nos registros do serviço de IA).
- Simular 429 em um item: a fila pausa inteira, o aviso aparece, os pendentes e os que estavam em análise mostram "Tentar novamente" e nenhum pedido é reenviado sozinho.
- Nunca mais de 2 pedidos ao mesmo tempo, inclusive com um item lento (conferido nos registros do serviço de IA).
- Trocar de vaga no meio do lote (a análise em andamento é salva) e trocar de empresa (nenhum status vaza de uma para outra).
- O resumo final mostra os números certos.
- Filtro: contadores certos, estado mantido no endereço e o lote funciona com "Sem análise" ativo.
- Arquivado e sem currículo ficam fora do lote e sem botão.
- Individual pelo card e pelo painel; a reanálise aparece no Histórico e o tempo na etapa não muda.
- Outro papel e outra empresa (simulação com desfazimento): botão oculto e 403 com a mensagem clara.
- Carlos não é analisado sem sua confirmação. Os fictícios de teste só são apagados depois, com sua autorização.
- Adicionar a tarefa ao roadmap, publicar e conferir no site oficial com Ctrl+Shift+R.
