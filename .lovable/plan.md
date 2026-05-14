## Objetivo

Resolver o problema dos links da Biblioteca (15 livros) que hoje:
- Levam para Amazon (às vezes para o livro errado, ou bloqueada em iframe)
- Em um caso (NR-1 Comentada) caem em busca do Google que pode bloquear
- Não têm fallback quando o link falha

## Solução proposta

Para cada um dos 15 livros, em vez de **um link só** para a Amazon, vou estruturar **três níveis de acesso**, do mais confiável para o de fallback:

1. **Resumo expandido in-app** (1 página, ~250–400 palavras) — sempre disponível, escrito por nós, descrevendo tese central, capítulos-chave e aplicação no contexto NR-1/CompSmart. É o conteúdo que o usuário vê **antes** de sair da plataforma.
2. **Link primário curado** — fonte oficial e estável (site do autor, editora brasileira, Skoob, Goodreads, página oficial do livro). Esses domínios não bloqueiam em iframe e raramente quebram.
3. **Link secundário** — Amazon BR com ISBN validado (verificarei cada um) **ou** Google Books com ID estável (`books.google.com/books?id=...`), usado como "comprar / ver mais edições".

## Mudanças no código (apenas frontend, 1 arquivo)

Arquivo: `src/pages/nr1/Nr1Biblioteca.tsx`

1. **Tipo `Livro`** — substituir `link: string` por:
   ```ts
   resumoCurto: string;       // o atual "resumo" (4-6 linhas, mostrado no card)
   resumoCompleto: string;    // novo, ~1 página, mostrado no dialog
   linkPrincipal?: { url: string; label: string };  // ex: site do autor
   linkCompra?: { url: string; label: string };     // Amazon/editora validada
   ```
2. **Validar e atualizar todos os 15 ISBNs** — vou pesquisar cada livro no Google Books API antes de gravar a URL, para evitar Amazon abrindo "outro livro". Se um ISBN não bater, removo o link de compra e mantenho só o resumo + link do autor.
3. **Substituir o botão "Saiba mais"** (que hoje abre link externo direto) por:
   - Botão **"Ler resumo"** → abre um `Dialog` (shadcn) com o resumo completo de ~1 página, autor, ano, categoria, e os botões de link externo (quando existirem) no rodapé do dialog.
   - Isso garante que **mesmo se todos os links externos falharem**, o usuário recebe o conteúdo prometido sem sair do CompSmart.
4. **Casos especiais**:
   - "NR-1 Comentada" (João Bosco Ribeiro, 2025) — remover o link Google Books search; manter só resumo + link da editora se localizável.
   - "Talent Intelligence" (Bersin) — manter link `joshbersin.com` como principal (já é estável).
   - Livros estrangeiros sem edição BR confiável → resumo em pt-BR + link Goodreads.

## O que o usuário verá

- **Card** continua igual visualmente (categoria, título, autor, ano, resumo curto).
- Botão "Saiba mais" passa a abrir um **modal interno** com:
  - Resumo de 1 página (sempre acessível)
  - 1 ou 2 botões de link externo no final, com rótulos claros ("Site do autor", "Comprar na Amazon", "Ver no Google Books")
  - Os links externos abrem em nova aba com `noopener`

## Fora de escopo

- Não vou criar página de detalhe roteada por URL (modal é suficiente)
- Não vou adicionar novos livros nem mudar categorias
- Não vou tocar nas outras abas (Metodologias, Siglas, Fatores de Risco)
- Sem mudanças de backend/banco — todo o conteúdo dos resumos fica como constante TypeScript no próprio arquivo
