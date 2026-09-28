# Faixa "Em reconstrução" + teste da candidatura no site publicado

## Parte 1 — Anti-robô (você faz no Cloudflare)
O botão fica em "Verificando…" porque a chave anti-robô não aceita compsmart.ia.br nem www.compsmart.ia.br (erro 110200). A propagação do DNS no Registro.br não causa esse problema. Você autoriza os endereços no painel: Cloudflare → Turnstile → widget da chave 0x4AAAAAACKfut… → Hostname Management. Adicione compsmart.ia.br, www.compsmart.ia.br, smartcomp.ia.br e www.smartcomp.ia.br e salve.

Quando você me avisar, eu testo no site publicado:
- o botão passa de "Verificando…" para "Enviar candidatura";
- a candidatura completa com PDF chega até "Candidatura enviada!";
- depois de uma falha, o "Reenviar" funciona com uma verificação nova;
- o painel do RH mostra fonte Portal, etapa Triagem e o currículo abre;
- no fim, apago o candidato, a candidatura e o currículo de teste.

## Parte 2 — Faixa de aviso no topo
- **Onde:** uma barra fina com a largura toda da tela, acima do cabeçalho, nas páginas institucionais (home, NR-1, módulos, preços, quem somos, materiais, contato etc.) e também no app para quem está logado. Ela aparece no computador e no celular.
- **Onde não aparece:** na listagem /vagas e na página da candidatura /vagas/[slug], para o candidato não ficar em dúvida no meio da inscrição.
- **Texto (Opção A):** "🚧 Estamos reconstruindo a CompSmart para oferecer ainda mais apoio ao RH. Em breve, muitas novidades." No celular, o texto quebra em duas linhas sem cortar.
- **Visual:** fundo azul da marca, texto branco e a tipografia atual. A barra é fina e discreta para não competir com a parte principal da home.
- **Animação:** um ponto pulsando no início, que indica "em andamento", e uma entrada suave de cima para baixo ao carregar. O texto não fica deslizando sem parar. Para quem configurou o computador com menos movimento, a animação fica desligada.
- **Navegação:** o cabeçalho fixo desce a altura da faixa e o conteúdo ganha o mesmo espaço extra. Assim os links, o Entrar e o Agendar demonstração continuam acessíveis e nada fica escondido.

## Validação
Vou rodar lint, tipos, testes, dead-code e build até passarem. Depois testo em 1280 px e 390 px: a faixa tem que aparecer na home, em /nr1 e no app logado, e não pode aparecer em /vagas nem em /vagas/[slug]. Em seguida publico e confiro no site publicado.

## Detalhes técnicos
- Novo `src/components/landing/public/AnnouncementBar.tsx` com cores por tokens semânticos, `animate-ping` no ponto, `animate-fade-in` na entrada e `motion-reduce:animate-none`.
- A altura da faixa fica numa variável CSS (`--announce-h`), usada pelo `top` do header fixo e pelo padding do `PublicLayout`. O layout do app recebe o mesmo tratamento.
- A condição fica no layout: a faixa não renderiza quando o caminho começa com `/vagas`, e aí `--announce-h` vale 0.
- Não há mudança no banco nem na função da candidatura. O roadmap.md recebe as duas tarefas.
