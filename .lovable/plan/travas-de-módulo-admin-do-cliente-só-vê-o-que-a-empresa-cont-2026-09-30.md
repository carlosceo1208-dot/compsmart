# Travas de módulo: admin do cliente só vê o que a empresa contratou

## Regra de negócio (as 3 garantias)

1. **Sempre ativo vs contratado**
   - **Core: sempre ativo** para toda empresa, porque é o módulo base. Hoje ele já é liberado automaticamente para empresas novas; a regra passa a valer mesmo sem registro de contratação.
   - **Contratados:** NR-1, Clima, Potencial & 9-Box, Insight (Remuneração/Mercado), Match, Talent, Evolve e RH Service. Sem contratação, a tela mostra o aviso "Ativar módulo" e o servidor não entrega os dados.
   - Exceção que continua valendo: o consultor acessa o RH Service só das empresas onde é dono de um projeto em andamento.
2. **Cruzamentos por fonte, um a um:** cada bloco da tela "Inteligência" só aparece se **todos** os módulos de onde ele tira dados estiverem contratados. Ter só o NR-1 não libera nada além dos dados do próprio NR-1.
   - Risco por dimensão (NR-1): exige NR-1.
   - Distribuição 9-Box por unidade: exige NR-1 + Potencial & 9-Box.
   - Cruzamento NR-1 × Desempenho × Remuneração (tabela "Detalhamento por Unidade", que hoje fica fora de qualquer trava) e os indicadores do topo (talentos, salário médio, custo de turnover, estrelas em risco): exigem NR-1 + Potencial & 9-Box + Insight.
   - Correlação Clima × Riscos psicossociais: exige Clima + NR-1.
   - Painel de Clima/FIB (/nr1/clima): exige Clima.
3. **Super admin CompSmart vê tudo** (suporte e validação interna). Isso fica restrito ao papel de super admin. O admin, o RH ou o gestor de uma empresa cliente nunca passa pela trava. O botão "Ver como cliente" continua desligando a exceção para o super admin conferir a visão do cliente.

## O que muda

- **Na tela:** a regra de acesso deixa de liberar tudo para o admin do cliente. A liberação automática fica só para o super admin, e o Core é tratado como sempre ativo. Os blocos de "Inteligência" ganham a trava por fonte descrita acima, incluindo a tabela que hoje fica sem trava.
- **No servidor:** a mesma regra passa a valer fora da tela. A leitura das pesquisas de Clima e os dados de 9-Box e remuneração usados nos cruzamentos passam a exigir o módulo contratado pela empresa, com o super admin como única exceção. Hoje, entre as regras de acesso do servidor, só as do Talent e uma do NR-1 conferem o módulo.
- A regra fica registrada nas regras técnicas do projeto.

## Testes (tabela "esperado × obtido", com capturas)

- **Admin da Empresa A (NR-1 + Core):**
  - Clima e todos os cruzamentos aparecem travados na tela.
  - Pedindo os dados direto ao servidor, com a sessão dele, recebe 0 linhas.
  - Continua vendo NR-1 e Core normalmente.
- **RH da Empresa A:** mesmo resultado do admin.
- **Empresa A com Potencial & 9-Box contratado de forma temporária:** a distribuição 9-Box aparece, mas o cruzamento com Remuneração continua travado, provando a trava individual por fonte.
- **Super admin:** vê tudo. Com "Ver como cliente" ligado, vê as mesmas travas do cliente.
- **Regressão:**
  - as empresas reais continuam vendo os módulos que contrataram;
  - o Talent (vagas, triagem) e a Maturidade continuam funcionando;
  - consultor dono continua acessando; consultor sem projeto continua sem acesso.
- **Fechamento:**
  - bun run ci limpo;
  - apagar as empresas, ciclos, respostas e logins [TESTE];
  - comparar com a foto "antes": Carlos, Josue, os 2 registros da Marli e os ciclos 34820df9 e 9bcaa5df intactos;
  - roadmap atualizado.

Se algum teste falhar, paro e mostro antes de corrigir. A publicação continua bloqueada até a sua revisão final.

## Detalhes técnicos

- `useModuleAccess.ts`: `adminBypass = isSuperAdmin && !viewAsClient` (tira `isAdmin`); `hasModule('core')` sempre verdadeiro.
- `Nr1Inteligencia.tsx`: `ModuleGate` com `moduleSlugs` e o modo "exige todos" em cada bloco. A tabela "Detalhamento por Unidade" e os indicadores do topo passam a ficar dentro da trava. `useNr1Intelligence` não busca `v_talent_intelligence_dashboard` sem os módulos da fonte.
- `has_module` no banco: `core` retorna verdadeiro; `is_super_admin()` libera; os demais conferem a contratação ativa na empresa raiz.
- Novas regras de acesso: `clima_pesquisas` e tabelas ligadas exigem `has_module('clima')`; as tabelas de 9-Box e sucessão por trás da view exigem `has_module('potencial-sucessao')`; os dados de remuneração do cruzamento exigem `has_module('insight')`, sem remover o acesso do Core às faixas salariais. Antes de mudar, confiro quais tabelas a view lê, para não bloquear telas do Core.
- Testes de servidor com a sessão de cada papel e desfeitos no final; contratação temporária em `tenant_subscriptions` apagada no final.
