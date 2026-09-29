# Agente Talent visível na Triagem (lote + por card + filtro)

## O que muda para o RH
- **Topo da aba Triagem**, ao lado do seletor de vaga:
  - Filtro **Todos | Com análise (N) | Sem análise (N)**, padrão "Todos", guardado no endereço (`?analise=com|sem`). Só muda o que aparece na tela.
  - Botão **"Analisar currículos (N)"**: N conta sempre os pendentes da vaga, seja qual for o filtro. Pendente = sem análise, com currículo e fora de Arquivado. Sem pendentes, o botão fica desativado.
- Ao clicar no botão: confirmação "Analisar N currículos? Consome créditos de IA." com **Confirmar**. O botão trava no primeiro clique, então não há chamadas duplicadas.
- **Fila:** no máximo 2 ao mesmo tempo, começando por quem está há mais tempo na etapa. No topo aparece "Analisando 3/12" com uma barra de progresso.
- **Status em cada card:** *Na fila* → *Analisando…* → nota colorida (80+ verde, 60–79 azul, abaixo de 60 âmbar) ou *Falhou* com **"Tentar novamente"** só naquele card. Uma falha não para a fila.
- **Análise demorada (mais de 60 s):** o card mostra "Demorando mais que o normal" e a fila segue com os próximos. O pedido não é cancelado, porque cancelar jogaria fora uma análise já cobrada. Se o resultado chegar, a nota aparece. Se falhar, aparece "Tentar novamente".
- **PDF acima de 10 MB:** esse card é pulado com um aviso e a fila continua. Hoje o envio já limita a 5 MB, então isso só protege contra arquivos antigos.
- **Créditos esgotados (402) ou excesso de pedidos (429):** a fila inteira pausa, aparece um aviso e os pendentes voltam a mostrar "Tentar novamente".
- **Botão no card** (ícone de faísca, rótulo acessível "Analisar currículo de {nome}"):
  - Sem análise: **"Analisar"** roda na hora, sem abrir o painel lateral.
  - Com análise: **"Reanalisar"**, com confirmação ("Substitui a análise anterior e consome créditos"). O Histórico registra "Reanálise do currículo: nota X → Y", com origem Agente. A etapa e o tempo na etapa não mudam.
  - Sem currículo: não mostra o botão, só a dica "Sem currículo para analisar". Arquivados também não têm o botão e não entram no lote.
- **Continua como está:** clicar no nome abre o painel (Análise/Histórico), o botão "Analisar currículo" do painel continua lá e **o agente nunca move ninguém de etapa**.

## Quem vê
- Só **admin e gestor de RH da própria empresa**, com o módulo Seleção contratado. Os demais não veem os botões. Se alguém tentar disparar mesmo assim, a resposta é "Sem permissão para analisar currículos".

## Detalhes técnicos
- **Passo 0:** ler as restrições e gatilhos de `candidato_historico`. Se algo proibir `etapa_anterior = etapa_nova`, criar uma migration incremental aditiva que libere só os eventos de reanálise, sem tocar em registros antigos e sem mexer nos 86 achados antigos.
- **Hook de fila** (`useTriagem`): `Map<candidaturaId, {status, erro}>` estável num `useRef`/estado próprio, que não depende da ordem da lista. A invalidação da lista após cada item não apaga os status. Concorrência 2, ordem `etapa_desde ASC`, pausa global em 402/429, sem aborto por timer (ver acima).
- **`agent-talent` (analisar):** checar `has_role` admin/hr_manager e confirmar que a empresa do usuário (`get_user_root_company_id_strict`) é a mesma da candidatura, com 403 claro. Mantém JWT, módulo, RLS, anonimização LGPD e registros só com tamanhos. Checar o tamanho do arquivo antes de baixar (>10 MB retorna 413, código `pdf_grande`). Na reanálise, inserir o evento no histórico com service role, sem atualizar `etapa_desde`.
- **Acessibilidade:** `role="progressbar"` com `aria-valuenow/min/max`, status dos cards em `aria-live="polite"` e `aria-label` nos botões.

## Validação
- `bun run ci`; Playwright em 1280 e 390.
- Lote com 3 candidaturas descartáveis (2 PDFs legíveis e 1 só com imagem) numa vaga de teste: contagem certa na confirmação, progresso correto, o PDF de imagem mostra "Tentar novamente" e os outros recebem nota. Duplo clique em Confirmar não gera chamada extra (conferido nos registros do serviço de IA).
- Simular 429 em um item: a fila pausa inteira, o aviso aparece e os pendentes mostram "Tentar novamente".
- Filtro: contadores certos, estado mantido no endereço e o lote funciona com "Sem análise" ativo.
- Arquivado e sem currículo ficam fora do lote e sem botão.
- Individual pelo card e pelo painel; a reanálise aparece no Histórico e o tempo na etapa não muda.
- Outro papel e outra empresa (simulação com desfazimento): botão oculto e 403 com a mensagem clara.
- Carlos não é analisado sem sua confirmação. Os fictícios de teste só são apagados depois, com sua autorização.
- Adicionar a tarefa ao roadmap, publicar e conferir no site oficial com Ctrl+Shift+R.
