# Página de administração de Leads

## O que você vai ver
Nova página **Leads** em `/admin/leads`, visível somente para super admin (mesma regra de acesso que já protege os contatos).

- **Lista de contatos** com data, nome, e-mail, empresa, cargo, porte, origem (Demo, Contato, Parceiro, E-book…) e status.
- **Filtros**: busca por nome/e-mail/empresa, origem e status. Contadores no topo: Novos, Em contato, Convertidos, Descartados.
- **Detalhe do lead** (ao clicar numa linha): todos os dados enviados (mensagem, LinkedIn, tipo de parceria, módulo de interesse, e-book baixado, consentimento LGPD).
- **Responder**: botão "Responder por e-mail", que abre seu e-mail com destinatário e assunto já preenchidos ("CompSmart — retorno sobre seu contato"). Ao responder, o status muda para "Em contato".
- **Mudar status** manualmente: Novo → Em contato → Convertido / Descartado.
- **Exportar CSV** da lista filtrada.
- Link "Leads" no painel/boas-vindas do Super Admin.

## Fora do escopo
- Envio de e-mail pelo próprio sistema (usa seu programa de e-mail). Posso adicionar depois, se quiser.
- Nenhuma mudança nos formulários públicos, textos ou preços.

## Detalhes técnicos
- Schema conferido: `leads.status` já existe, obrigatório, com padrão `'novo'`, sem restrição de valores. Hoje há 1 contato (origem `materiais-ebook-remuneracao`, status `novo`), então não é preciso preencher nada.
- Migração pequena: fixar os status permitidos em `novo`, `em_contato`, `convertido`, `descartado` (restrição de valores). Por segurança, o painel também trata status vazio ou desconhecido como "Novo" nos contadores.
- Políticas atuais: leitura/edição/exclusão só para `is_super_admin`; inserção pública com consentimento. Não mudam.
- Lista ordenada por `created_at` do mais novo para o mais antigo; busca por nome/e-mail/empresa sem diferenciar maiúsculas (`ilike`).
- Rótulos de origem (filtro e detalhe): `materiais-ebook-remuneracao` = E-book Remuneração; `demo`/`diagnostico` = Demonstração; `contato` = Contato; `parceiro` = Parceiro; `ebook:nr1` = E-book NR-1; `ebook:clima-9box` = E-book Clima & 9-Box; `ebook:remuneracao` = E-book Remuneração; outros = primeira letra maiúscula.
- O detalhe mostra todos os campos enviados, a origem legível e o consentimento LGPD.
- Novo `src/pages/admin/Leads.tsx` + hook `useAdminLeads` (React Query: listar, atualizar status). Guarda de rota igual ao `SuperAdminDashboard` (redireciona quem não é super admin; exige MFA).
- Rota adicionada em `App.tsx` junto de `/admin/convidar-socios`; link em `SuperAdminWelcome.tsx`.
- Resposta via `mailto:`; exportação com o `csvExport.ts` existente.
- Validação com Playwright como super admin.
