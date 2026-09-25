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
- Tabela `leads` já existe, com `status` e políticas de leitura/edição/exclusão só para `is_super_admin`. Sem migração, a menos que os valores atuais de `status` precisem de ajuste (conferir os valores existentes antes de fixar a lista).
- Novo `src/pages/admin/Leads.tsx` + hook `useAdminLeads` (React Query: listar, atualizar status). Guarda de rota igual ao `SuperAdminDashboard` (redireciona quem não é super admin; exige MFA).
- Rota adicionada em `App.tsx` junto de `/admin/convidar-socios`; link em `SuperAdminWelcome.tsx`.
- Resposta via `mailto:`; exportação com o `csvExport.ts` existente.
- Validação com Playwright como super admin.
