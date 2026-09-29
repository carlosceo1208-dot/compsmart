# Abrir o currículo dentro do próprio app

## Situação atual (conferida)
- O espaço de currículos já é **privado**, com limite de 5 MB.
- Regras de acesso atuais: só admin/gestor de RH da **mesma empresa** (com o módulo Seleção ativo) e super admin conseguem ler. Não há acesso público.
- No banco fica guardado só o **caminho** do arquivo (`empresa/candidato.pdf`), não um link. Nenhum link antigo é salvo.
- Hoje o botão "Currículo" gera um link de 5 min e abre esse link numa aba nova. Essa ida direta para o endereço do servidor é o que o navegador ou uma extensão bloqueia.

## O que muda
1. **Nova função no servidor `curriculo-download`**: recebe o id do candidato, confere se quem pediu é admin/gestor de RH da mesma empresa do candidato (ou super admin), lê o caminho no banco e devolve o **próprio PDF**. O link gerado dura 1 h, é criado na hora e nunca fica guardado.
2. **Botão "Currículo"**: busca o PDF pela função, cria uma cópia temporária no navegador e abre em nova aba (endereço do próprio app, `blob:`). Se o navegador bloquear a aba nova, o arquivo é baixado com o nome `Curriculo - Nome do Candidato.pdf`. Enquanto carrega, o botão mostra um indicador e fica desativado.
3. **Mensagens amigáveis** (aviso no canto, nunca tela branca):
   - acesso negado → "Você não tem permissão para ver este currículo."
   - arquivo não encontrado → "Currículo não encontrado."
   - falha ou link expirado → "Link expirado. Tente abrir novamente."
4. As regras de acesso ao espaço de arquivos continuam como estão (já atendem o item 3); a função no servidor passa a ser o único caminho usado pelo painel.

## Validação
- Lint, tipos, testes, código morto e build (`bun run ci`).
- Teste da função: sem login → recusado; usuário de outra empresa → recusado; RH da empresa → PDF.
- Site publicado com o usuário do painel: o PDF abre em Chrome e Edge sem sair do app.
- Depois, apagar a candidatura de teste (candidato, vínculo com a vaga e PDF).

## Detalhes técnicos
- Função: valida o JWT com `getClaims`, corpo validado com Zod (`candidatoId` uuid), consulta `candidatos.root_company_id` e `curriculo_url` com service role, confere `get_user_company_id` + `has_role` admin/hr_manager + `has_module('talent')` ou super_admin; `createSignedUrl(path, 3600)`, baixa no servidor e responde `application/pdf` com CORS. Assim o navegador conversa só com a função (a mesma origem já usada por todo o painel), sem navegar para o link de arquivo.
- `abrirCurriculo(candidatoId, nome)` em `useCandidatos.ts`: `fetch` → `blob` → `URL.createObjectURL` → `window.open`; se retornar `null`, cria `<a download>`; `revokeObjectURL` após 60 s. Erros mapeados por status (401/403/404/outros).
- `Candidatos.tsx`: estado de carregamento por candidato no botão.
- Registrar a decisão no `AGENTS.md` (currículo só via função, nunca link direto).
