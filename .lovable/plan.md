# Fundação de compra modular (somente backend)

Objetivo: criar no banco a estrutura que permite vender a CompSmart por módulo, com preço por faixa de colaboradores, sem mexer em nada visual. Nada do que já funciona é reconstruído: papéis/permissões, agentes de IA, funções do NR-1, pagamentos, alertas, e-mails e indicadores continuam intactos.

## O que será criado

**Catálogo de módulos (9)**
core (Remu), insight (Insight), match (Match), nr1 (Psi — produto legal), clima (Clima), talent (Talent), evolve (Evolve), potencial-sucessao (Potencial — "Avaliação de Potencial e Sucessão", independente do NR-1), rh-service (Consultores Seniores — preço negociado).

**Preços por faixa de colaboradores**
Faixas 0-50, 51-200, 201-500, 501-1000, 1001+ para cada módulo, com preço em branco para você definir depois. Exceções já semeadas: o módulo core entra com os valores atuais como base (R$ 299 até 50, R$ 899 até 200, R$ 1.900 até 500) e o módulo nr1 entra com R$ 225 na faixa até 50 colaboradores (faixa Essencial travada), com as demais faixas em branco. O rh-service fica marcado como negociável, sem preço fixo.

**Combos (bundles)**
Lista de combos com percentual de desconto e quais módulos cada combo inclui.

**Contratações por empresa**
Registro de qual empresa contratou qual módulo (ou combo), com situação (ativo/teste/cancelado), data de início e de expiração. Uma linha por empresa + módulo.

**Captação de leads dos e-books**
Nome, e-mail, empresa, cargo, porte (pequena/média/grande), módulo de interesse, qual e-book gerou o lead, consentimento LGPD obrigatório, origem, situação e data.

## Regras de liberação

- Nova verificação `has_module('slug')`: diz se a empresa do usuário logado tem aquele módulo contratado e vigente.
- Nova consulta `get_tenant_modules()`: devolve a lista de módulos contratados da empresa — será o que o painel usará depois para liberar ou bloquear cada card.
- O painel continua centralizado: o cliente vê tudo, e cada card sem módulo contratado fica bloqueado com o convite "Ativar módulo". Essa parte visual entra numa etapa seguinte; agora só a base de dados.

## Privacidade e isolamento

- Catálogo (módulos, faixas de preço, combos) é de leitura pública, inclusive para visitantes sem login, para a página de vendas exibir preços; alteração apenas por super admin.
- Contratações: cada empresa vê somente as suas; alteração apenas por super admin/sistema de pagamento.
- Leads: gravação liberada para o formulário público (com consentimento obrigatório), leitura restrita a super admin — dado pessoal não fica exposto.

## Compatibilidade com o que já existe

As marcações atuais de serviços adicionais por empresa (NR-1, Clima, FIB, cruzamento psicossocial, check-up) serão convertidas automaticamente em contratações dos módulos correspondentes, para que nenhum cliente perca acesso no dia da virada. As regras antigas de plano continuam valendo em paralelo até o frontend migrar.

## Detalhes técnicos

- Tabelas novas em `public`: `modules`, `module_pricing`, `bundles`, `bundle_modules`, `tenant_subscriptions`, `leads` — cada uma com `GRANT` explícito, RLS habilitada e políticas, além de `created_at`/`updated_at` com trigger.
- `tenant_subscriptions`: FK para `organizational_structure(id)` como tenant, `module_id` ou `bundle_id`, `UNIQUE (tenant_id, module_id)`, índice por tenant.
- `has_module(text)` e `get_tenant_modules()`: `SECURITY DEFINER`, `search_path = public`, reutilizando `get_user_company_id()`; `EXECUTE` concedido a `authenticated` (não a `anon`).
- `leads`: `INSERT` para `anon` com `consentimento_lgpd = true` obrigatório e reaproveitamento do padrão de throttle já aplicado em `nr1_leads`; `SELECT` só via `is_super_admin(auth.uid())`.
- `GRANT SELECT` também para `anon` em `modules`, `module_pricing`, `bundles` e `bundle_modules`, com policy de leitura para `anon, authenticated`; escrita segue só por `is_super_admin`. `tenant_subscriptions` e `leads` não recebem nada para `anon` além do INSERT de leads já previsto.
- Seed idempotente (`ON CONFLICT (slug) DO UPDATE`) dos 9 módulos e das faixas de preço, incluindo `nr1` = 225,00 na faixa 0-50.
- Backfill das flags `*_addon_enabled` de `organizational_structure` para `tenant_subscriptions` (status `active`).
- Nada de alteração em `company_subscriptions`, `subscription_plans`, edge functions de pagamento ou RBAC.

## Fora do escopo nesta etapa

Frontend, landing page, checkout, dashboards e qualquer mudança visual.
