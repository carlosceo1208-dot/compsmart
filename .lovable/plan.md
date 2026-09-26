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

## Verificação
Lint, typecheck, test, dead-code e build passando. Navegador (desktop e celular): (a) candidatura anônima com PDF e aceite obrigatório + confirmação; (b) rascunho/pausada/fechada não aparecem; (c) cadastro pelo RH + planilha com prévia e erros; (d) mesmo e-mail não duplica; (e) RH vê o currículo, outra empresa não (teste de acesso no banco); (f) candidatura em "Triagem" na vaga certa. Candidatos de teste são apagados ao final; contatos e vagas reais não são tocados.
