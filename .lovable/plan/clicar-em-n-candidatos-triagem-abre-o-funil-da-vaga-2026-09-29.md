# Clicar em "N candidatos | Triagem" abre o funil da vaga

## O que muda
- No card da vaga, o trecho "1 candidato · Triagem" vira um botão próprio. Ao clicar, abre **Candidatos → aba Triagem** com essa vaga já escolhida e os candidatos nas colunas.
- Clicar no resto do card continua abrindo "Editar vaga", como hoje.
- Leitor de tela: "Ver triagem da vaga {título}".
- Função que move candidatos: continua como está.
- No roadmap entra o teste de aceite pendente: abrir currículo e "Analisar currículo" logado como uma segunda empresa real.

## Ajustes pedidos
1. **Endereço e vida da vaga escolhida:** o endereço é `/recrutamento/candidatos?aba=triagem&vaga={id}` (a rota foi conferida no app). A vaga só vale na aba Triagem. Ao trocar para Lista, ela sai do endereço, para a lista não ficar filtrada sem querer. Ao trocar de vaga no seletor do funil, o endereço acompanha.
2. **Vaga inexistente ou fora da lista** (rascunho sem acesso, outra empresa, endereço errado): o funil mostra a vaga publicada mais recente, com um aviso discreto: "Vaga não encontrada, exibindo a mais recente." Nada quebra.
3. **Teclado sem abrir duas coisas:** o Enter no botão novo não chega ao card. Teste: Tab até o botão, Enter → abre só o funil, sem a janela de edição.
4. **Visual no celular (390px):**
   - área de toque de 44px só no próprio trecho, sem invadir o título nem o resto do card;
   - contador legível;
   - o card fica com a mesma aparência de hoje.

## Detalhes técnicos
- `Vagas.tsx`: `<Link>` com `onClick` e `onKeyDown` chamando `stopPropagation`; o `onKeyDown` do card ignora eventos que vierem de dentro do link (`e.target !== e.currentTarget`). Recebe `aria-label`, `min-h-11 inline-flex` e padding só no link.
- `Candidatos.tsx`: `Tabs` controlado por `useSearchParams`. Ao ir para "lista", apaga `vaga`.
- `TriagemKanban.tsx`: props `vagaInicial` e `onVagaChange`. Valida a vaga contra a lista da empresa; se não achar, usa o fallback e mostra o aviso.
- Validação:
  - `bun run ci`;
  - Playwright em 1280px e 390px: clique no link, clique no card, Tab+Enter, `?vaga=` inválido, troca para a aba Lista;
  - publicar e conferir no site oficial.
