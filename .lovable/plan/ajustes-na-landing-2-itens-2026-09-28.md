# Ajustes na landing — 2 itens

## 1. Faixa "Em reconstrução" — já feita
Já está pronta e testada: texto aprovado, azul da marca, ponto pulsando, entrada suave, sem texto correndo, respeita "menos movimento". Não aparece em /vagas nem em /vagas/[slug]. Só falta conferir de novo junto com o item 2. Nada novo para construir.

## 2. Nova página de Recrutamento & Seleção
Vai substituir o conteúdo atual de /modulos/selecao-rs (o link do menu "Módulos" continua o mesmo) por uma página própria:

1. **Abertura** — título "Sua próxima contratação já nasce com a faixa salarial certa.", subtítulo sobre o R&S ligado à estratégia de remuneração, 4 pontos (faixa com origem declarada, vagas confidenciais, perfil gerado por IA, LGPD) e botão "Agende uma demonstração".
2. **Problema** — "Quanto custa uma vaga parada?" (texto explicativo, sem números inventados).
3. **Solução em 3 cards** — vaga que nasce certa / sigilo em busca executiva / IA e funil.
4. **Prova de eficiência** — indicadores que o sistema mede (tempo de vaga aberta, candidaturas por vaga, conversão por etapa, vagas com faixa definida), apresentados como **o que você passa a acompanhar**, sem porcentagens nem resultados de clientes inventados.
5. **Chamada final** em fundo navy com "Agende uma demonstração" e link para o portal /vagas.

Visual: fundo claro, azul #2563EB, navy #176EA1, verde #16A34A, com a mesma fonte do site. Pensado para celular (360 px) e computador (1280 px).

## Ajustes finais (antes de publicar)
1. **SEO** — título, descrição, endereço oficial (canonical) e as tags de compartilhamento (og:) de /modulos/selecao-rs vêm todos da lista central de SEO; o texto é revisado para o novo título.
2. **Navegação rápida** — no topo da página, links para Abertura, Problema, Solução e Métricas, com rolagem suave (desligada para quem escolheu menos movimento) e descontando a altura do menu fixo.
3. **Janela "Agende uma demonstração" no celular** — testar em 390 px se ela abre, rola até o botão de enviar e fecha; corrigir a altura, se for preciso.
4. **(Opcional) Imagem do funil** — card compacto (~4:3) na seção 4, dentro da largura da página, sem faixa larga 16:9. Só entra se a imagem do funil já gerada estiver no projeto; se não estiver, peço que você envie.

## Validação
- Lint, tipos, testes, código não usado e build passando.
- Testar em 1280 e 390 px: página nova, faixa visível na home/NR-1/nova página, ausente em /vagas e /vagas/[slug], menu e "Entrar" funcionando.
- Publicar quando o DNS estiver pronto e você autorizar.

## Detalhes técnicos
- Novo `src/pages/public/LandingRecrutamento.tsx` usando `PublicLayout` + `DemoDialog`; rota `/modulos/selecao-rs` passa a apontar para ela em `App.tsx` (antes de ModuloPage genérico).
- Cores navy/verde como tokens no `index.css` e `tailwind.config.ts` (sem hex nos componentes).
- Título/descrição atualizados em `src/config/seoRoutes.ts`; `SeoHead` já gera canonical, og:* e twitter:* a partir dessa entrada, e o prerender do `vite.config` coloca isso no HTML estático.
- Seções com `id` + `scroll-margin-top`; navegação rápida com `scrollIntoView({behavior:"smooth"})` respeitando `prefers-reduced-motion`.
- `DemoDialog`: `max-h-[90dvh] overflow-y-auto` se o teste em 390 px mostrar corte.
- Registrar os 4 ajustes no `roadmap.md` ao iniciar a implementação.
