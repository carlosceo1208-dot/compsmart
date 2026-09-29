# Clicar em "N candidatos | Triagem" abre o funil da vaga

## O que muda
- No card da vaga, o trecho "1 candidato · Triagem" vira um botão próprio com área de toque maior (mín. 44px de altura no celular). Ao clicar, abre **Candidatos → aba Triagem** com essa vaga já escolhida e os candidatos nas colunas.
- Clicar no resto do card continua abrindo "Editar vaga", como hoje.
- Leitor de tela: "Ver triagem da vaga {título}".
- RPC de mover candidatos: fica como está, conforme sua orientação.
- No roadmap entra o teste de aceite pendente: abrir currículo e "Analisar currículo" logado como uma segunda empresa real.

## Detalhes técnicos
- `Vagas.tsx`: o trecho contador + etapa vira `<Link to="/recrutamento/candidatos?aba=triagem&vaga={id}">` com `onClick` e `onKeyDown` chamando `stopPropagation`, para não disparar o clique do card, com `aria-label` e `min-h-11`.
- `Candidatos.tsx`: `Tabs` passa a ser controlado por `useSearchParams` (`aba`, padrão "lista"). Trocar de aba atualiza a URL.
- `TriagemKanban.tsx`: recebe `vagaInicial` vindo de `?vaga=`. Usa esse valor se a vaga existir na lista da empresa. Se não existir, cai no comportamento atual (vaga publicada mais recente).
- Validação: `bun run ci`; Playwright em 1280px e 390px (clicar no link abre o funil certo, clicar no card abre a edição); publicar e checar no site oficial.
