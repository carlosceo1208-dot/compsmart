# Página /diagnostico — "Diagnóstico grátis em 2 min"

## O que o cliente vai ver
- Nova página pública `/diagnostico` no visual atual do site, com formulário de 5 campos + aceite LGPD.
- Botão "Receber meu diagnóstico" liberado só com tudo preenchido.
- Confirmação: "Recebemos seu pedido! Em instantes você recebe seu diagnóstico por e-mail." + botão secundário "Agendar demonstração" (leva para /contato).

## Botões que passam a apontar para /diagnostico
Encontrados no código hoje:
- /nr1: "Diagnóstico grátis NR-1" (2 botões)
- /sobre-nos: "Agende um diagnóstico gratuito"
- Home: faixa NR-1 ("Diagnóstico grátis em 2 minutos") e destaque NR-1 ("Diagnóstico grátis em 2 min")
Só o destino muda; textos, cores e layout ficam iguais.

## Formulário
Nome*, E-mail corporativo*, Porte (Pequena/Média/Grande)*, Colaboradores (até 99 / 100–499 / 500+)*, Módulo de interesse (NR-1/Riscos Psicossociais, Clima Organizacional, Cargos e Salários, Remuneração, 9-Box/Sucessão)*, aceite LGPD obrigatório com o texto pedido.

## Envio e e-mail repetido
- Grava na lista de contatos com origem `diagnostico`, LGPD = sim, status `novo` → aparece em /admin/leads como "Demonstração/Diagnóstico" e "Novo", e acende o aviso do sino.
- Os três dados de qualificação ficam salvos: porte e módulo de interesse já têm campo próprio na lista; colaboradores ganha um campo novo. Os três aparecem no detalhe em /admin/leads.
- E-mail já existente com origem diagnóstico: não cria outro registro; atualiza porte, colaboradores e módulo e mostra a mesma confirmação.
- Status no reenvio: se o lead está `convertido`, continua `convertido`; em qualquer outro caso (inclusive `descartado`), volta para `novo`.
- Ordem no painel: o reenvio grava a data de "último interesse". A lista em /admin/leads passa a ordenar pelo último interesse (mais recente primeiro). O detalhe mostra "Recebido em" e "Último interesse".

## Achado importante (seu lembrete)
Os dois formulários da /nr1 ("Diagnóstico" origem `landing_nr1` e "Solicite uma proposta personalizada" origem `landing_nr1_proposta`) gravam numa lista SEPARADA de contatos da NR-1, e por isso NÃO aparecem em /admin/leads nem no contador. Proposta: incluir essa lista também no painel de leads (somente leitura dessa lista, marcada como origem "NR-1 Landing" / "NR-1 Proposta"). Posso fazer junto ou deixar para depois — me diga ao aprovar.

## SEO (fonte única, sem override por JS)
- Entrada em `seoRoutes.ts`: title "Diagnóstico NR-1 Grátis em 2 Minutos | CompSmart"; description "Faça grátis o diagnóstico NR-1 em 2 minutos: riscos psicossociais pelo método COPSOQ-III, anônimo e em conformidade com a LGPD, com resultado imediato." ; canonical `https://www.compsmart.ia.br/diagnostico`.
- Entra automaticamente no sitemap e no HTML pré-gerado. Nenhum `document.title` no componente.

## Validação
- Desktop e celular (Playwright): preencher → enviar → confirmação; conferir lead no banco com origem `diagnostico` e status `novo`; reenviar mesmo e-mail → continua 1 registro.
- `dist/diagnostico/index.html` e, após publicar, HTML bruto de `https://www.compsmart.ia.br/diagnostico`: title, description, canonical próprios.
- Lead de teste criado na validação será removido; o lead da Marli não é tocado.

## Detalhes técnicos
- Migração: adicionar coluna `colaboradores text` em `leads` (`porte` e `modulo_interesse` já existem); função `SECURITY DEFINER` `submit_diagnostico_lead(...)` com validação de tamanho/e-mail, LGPD obrigatório, upsert por `lower(email)` + origem `diagnostico` (visitante anônimo não consegue ler a tabela, por isso a checagem fica no servidor); no reenvio: `status = CASE WHEN status='convertido' THEN status ELSE 'novo' END`, `updated_at = now()`; `GRANT EXECUTE` para anon/authenticated. Respeita throttle existente.
- Front: `src/pages/public/Diagnostico.tsx` (zod + react-hook-form, componentes shadcn existentes), rota em `App.tsx` dentro do `PublicLayout`; `useAdminLeads` ordena por `updated_at desc` e o detalhe exibe porte, colaboradores, módulo e "Último interesse". Registrar a nova regra de ordenação em AGENTS.md.
- Não mexe em app/dashboard, pagamentos, checkout nem outras páginas além da troca de links.
