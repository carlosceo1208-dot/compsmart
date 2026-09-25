# /diagnostico com o questionário de volta

## O que aconteceu
Os botões de diagnóstico da página da NR-1 abriam antes um questionário curto ali mesmo: perguntas de riscos psicossociais, depois cadastro e resultado na tela. Ao levar esses botões para `/diagnostico`, a nova página ficou só com o cadastro, e o questionário não aparece mais.

## Como vai ficar (um único fluxo em /diagnostico)
```text
1. Questionário (as mesmas perguntas de antes, uma por vez, com barra de progresso)
2. Cadastro curto (os 5 campos atuais + aceite LGPD)
3. Resultado na tela: pontuação e nível de risco (baixo / moderado / alto / crítico)
   + "Agendar demonstração"
```
- O botão "Diagnóstico grátis em 2 min" e os demais continuam levando para `/diagnostico`. Agora a pessoa começa direto pelas perguntas.
- A página da NR-1 fica como está visualmente. O questionário antigo dentro dela deixa de ser usado, para existir um só caminho.
- A mensagem de confirmação continua. O resultado passa a aparecer logo abaixo dela.

## O que fica salvo no contato
- Continua como hoje: origem "Diagnóstico", status "Novo", sem duplicar e-mail e sem rebaixar "Convertido".
- Novo: pontuação, nível de risco e respostas do questionário. A pontuação e o nível aparecem no detalhe em /admin/leads.
- As respostas são de quem preencheu, em nome da empresa. Não são respostas anônimas de colaboradores.

## Validação
- Responder todas as perguntas → cadastrar → ver o resultado, no computador e no celular (Playwright).
- Conferir o contato com pontuação e nível; reenviar com o mesmo e-mail → continua 1 registro. O contato de teste é apagado depois; o da Marli não é tocado.
- O título e o endereço oficial da página continuam os mesmos.

## Detalhes técnicos
- Migração: colunas `score_free numeric`, `nivel_risco_free text`, `respostas_free jsonb` em `leads`. `submit_diagnostico_lead` ganha `_score`, `_nivel` e `_respostas`, com validação: score de 0 a 100, nível no conjunto conhecido e respostas com até 60 chaves. Mesma regra de upsert.
- `Diagnostico.tsx`: passos `questionario → lead → resultado`, reaproveitando `useNr1Questoes(true)`, `calcRisco`, `RISCO_LABEL/RISCO_CLASS`, `RESPOSTA_OPCOES` e a mesma fórmula de pontuação da `LandingNr1` (média com itens reversos × 25). O cálculo vai para uma função compartilhada em `src/lib/nr1.ts`, para não duplicar.
- `Leads.tsx`: exibir no detalhe a pontuação e o nível de risco.
- `LandingNr1.tsx`: só remove o bloco `questionario/lead/resultado` que não é mais alcançado; textos e layout visíveis não mudam.
