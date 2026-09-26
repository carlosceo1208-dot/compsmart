# Fase 2 — Recrutamento & Seleção (Aquisição de Talentos): Portal público de vagas + Candidatos

## O que o RH e o candidato vão ter
- **Portal público `/vagas`** (sem login, visual CompSmart público, sem a barra lateral do app): só vagas **publicadas** de empresas com o módulo contratado. Cada card mostra título, área, senioridade, modelo, "Cidade – UF" (ou só a cidade / "—") e faixa salarial só se a empresa marcar para exibir.
- **Página da vaga `/vagas/:slug`**: responsabilidades, requisitos obrigatórios e desejáveis, competências e o formulário de candidatura: nome, e-mail, telefone (com máscara), cargo pretendido, senioridade, currículo PDF opcional (até 5 MB) e aceite LGPD obrigatório (data e versão gravadas). Erros aparecem por campo; ao enviar, tela de confirmação.
- **Sem duplicidade**: mesmo e-mail na mesma empresa reaproveita o candidato e só cria a nova candidatura; se já se candidatou àquela vaga, avisa. Em outra empresa, é um registro novo.
- **Página `/recrutamento/candidatos`** (bloqueada sem o módulo): lista com busca por nome/e-mail e filtros por origem (RH/Portal), etapa e vaga; abre o currículo.
- **Cadastro manual pelo RH**: mesmos campos + observações, currículo e vínculo com uma ou mais vagas (entram em "Triagem").
- **Colar da planilha** no formato `nome;email;telefone`: prévia linha a linha, linhas inválidas marcadas com o motivo (nunca corrigidas em silêncio), só as válidas são importadas.
- Nas vagas, o card passa a mostrar o número real de candidatos.
- Nenhum dado de candidato é enviado à IA nesta fase.

## Detalhes técnicos
- **Migração**:
  - `vagas`: adicionar `slug` (único, gerado de título + sufixo curto) e `exibir_faixa boolean default false`.
  - `candidatos` (campos do pedido; `email` em minúsculas, único por `(root_company_id, email)`; `fonte` check `rh|portal`; `observacoes`; consentimento).
  - `candidaturas` (único `candidato_id+vaga_id`; `etapa` check triagem/entrevista_rh/entrevista_gestor/proposta/contratado, padrão triagem; `status` padrão `ativa`; `match_score` nulo).
  - GRANT authenticated/service_role (sem anon); RLS: própria empresa via `get_user_company_id()` + `has_module('talent')` + admin/hr_manager, ou super_admin; triggers de `updated_at`.
  - RPC `portal_listar_vagas()` e `portal_vaga(slug)` (security definer, só `publicada` + módulo ativo, só colunas públicas; nome da empresa exibido). Sem política anon nas tabelas.
- **Candidatura pública**: edge function `portal-candidatura` (sem JWT, service role): valida com Zod, verifica vaga publicada, upsert do candidato por e-mail na empresa dona, cria a candidatura, grava o PDF em `curriculos/{root_company_id}/{candidato_id}.pdf` (checa tipo e 5 MB no servidor), aplica Turnstile e limite por IP (`check_rate_limit`) contra spam.
- **Storage**: bucket privado `curriculos` (5 MB, `application/pdf`); leitura só para admin/hr_manager da empresa dona pelo primeiro segmento do caminho; o RH abre por URL assinada.
- **Cadastro RH**: RPC `talent_upsert_candidato` (dedup por e-mail, fonte `rh`, candidaturas) usada pelo formulário e pela importação.
- Constantes centralizadas em `src/config/recrutamento.ts` (versão do consentimento, 5 MB, formatos, etapas).
- Front: `src/pages/public/VagasPortal.tsx`, `VagaPublica.tsx` (dentro do layout público, SEO de `/vagas` em `seoRoutes.ts`; detalhe fica `noindex` por ser dinâmico), `src/pages/recrutamento/Candidatos.tsx`, `CandidatoDialog.tsx`, `ImportarCandidatosDialog.tsx`, hook `useCandidatos.ts`; nova opção "Exibir faixa no portal" e link público no card/diálogo da vaga; item do menu do módulo.
- Registrar em `roadmap.md` e `AGENTS.md`.

## Refinamentos
1. **Proteção anti-robô (Turnstile)**: o projeto já tem a chave pública (usada no `TurnstileWidget`) e a chave secreta no servidor (usada por `verify-turnstile`/`activate-employee`); o portal reaproveita as duas, sem criar chaves novas. No preview/localhost a função aceita as chaves de teste oficiais da Cloudflare (sempre aprovam), para não travar testes; no site publicado vale a verificação real.
2. **Currículo no reenvio**: caminho fixo por candidato (`{empresa}/{candidato}.pdf`); um novo PDF **sobrescreve** o anterior e todas as candidaturas passam a apontar para o mais recente. Sem novo PDF, o atual é mantido. Registrado no `AGENTS.md`.
3. **Erros amigáveis na candidatura**: limite de tentativas (429) ou falha da verificação anti-robô mostram "Muitas tentativas — tente novamente em instantes" com botão **Reenviar**; nenhum detalhe técnico aparece. Os dados digitados permanecem no formulário.
4. **Link público copiável**: no card e no diálogo da vaga publicada, botão **Copiar link** (1 clique, aviso "Link copiado"). Em rascunho/pausada/fechada o botão fica oculto.
5. **Endereço das vagas já existentes**: a migração gera o endereço de todas as vagas atuais (título sem acentos, até 60 caracteres). O endereço é único no site inteiro: em colisão, mesmo entre empresas, ganha sufixo numérico (`analista-de-rh-2`, `-3`...), com nova tentativa automática. Vagas novas seguem a mesma regra via gatilho.
6. **Empresa sempre pela vaga**: a candidatura pública recebe só o endereço da vaga; a empresa é lida da vaga no banco, nunca do que o navegador envia.
7. **Planilha com e-mail repetido**: a segunda ocorrência (e seguintes) do mesmo e-mail na mesma colagem aparece no log como "duplicado na planilha (linha X)" e não é importada.
8. **PDF verificado de verdade**: além do tipo e dos 5 MB, o servidor confere se o arquivo começa com `%PDF`; caso contrário, recusa com "Envie um arquivo PDF válido".
9. **Trilha LGPD**: junto com data e versão do aceite, grava IP e navegador do candidato (visíveis só ao RH da empresa, para auditoria).
10. **Importação vinculada a vaga**: campo opcional "Vincular a uma vaga" no diálogo de colar planilha. Preenchido, cada candidato válido ganha candidatura em "Triagem" nessa vaga (sem duplicar se já estiver nela); vazio, importa só os candidatos. Log de erros e regra de duplicado na planilha continuam iguais.

## Fica para a Fase 3
- **Excluir candidato/candidatura** (direito de eliminação da LGPD): botão com confirmação, só para RH/admin da própria empresa, validado no servidor, apagando também o currículo. Registrado no `roadmap.md`; não entra nesta fase.

## Visibilidade da vaga (2 eixos, independentes do status)
Segue a versão mais completa do requisito (a com "2 eixos").
- **Pública (padrão)**: aparece na lista `/vagas`. Com "Exibir nome da empresa no portal" marcado, mostra o nome; desmarcado, mostra a "Descrição pública do cliente" (ex.: "Indústria do setor alimentício, atuação nacional") ou, se vazia, "Empresa não identificada".
- **Confidencial**: nunca listada; só abre pelo link direto; nome sempre oculto ("Empresa confidencial" ou a descrição pública); faixa salarial nunca exibida; no formulário, nota "Vaga confidencial — detalhes da empresa serão apresentados em etapa futura do processo."
- **No cadastro do RH**: seletor "Visibilidade: Pública / Confidencial" com dica ("Confidencial: não aparece na listagem pública; divulgada apenas por link direto"); caixa "Exibir nome da empresa" só em Pública; campo opcional "Descrição pública do cliente" (até 160 caracteres); em Confidencial, "Exibir faixa no portal" some.
- **Na lista interna**: selo "Confidencial" nos cards e filtro por visibilidade. "Copiar link" funciona nos dois casos.
- **Banco**: colunas `visibilidade` (check publica/confidencial, padrão publica), `exibir_nome_empresa` (padrão true) e `descricao_publica_cliente`; vagas existentes ficam Pública + nome exibido. Um gatilho força `exibir_nome_empresa=false` e `exibir_faixa=false` em Confidencial. `portal_listar_vagas` filtra `publicada` + `publica`; `portal_vaga(slug)` devolve o nome já mascarado pelo servidor (confidencial ou nome oculto) — o nome real nunca chega ao navegador. RLS e bloqueio por módulo inalterados.
- **SEO**: todas as páginas de detalhe `noindex` e fora do sitemap; só `/vagas` entra.

## Verificação
Lint, typecheck, test, dead-code e build passando. Navegador (desktop e celular): (a) candidatura anônima com PDF e aceite obrigatório + confirmação; (b) rascunho/pausada/fechada não aparecem; (c) cadastro pelo RH + planilha com prévia e erros; (d) mesmo e-mail não duplica; (e) RH vê o currículo, outra empresa não (teste de acesso no banco); (f) candidatura em "Triagem" na vaga certa; (g) confidencial publicada fora da lista, link direto funciona, nome mascarado, candidatura OK; (h) pública anônima listada com nome mascarado; (i) pública normal com nome. Candidatos de teste são apagados ao final; contatos e vagas reais não são tocados.
