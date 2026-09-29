# Fase 4 — Modelo "consultor dono do cliente"

Decisão dos sócios: cada consultor vê apenas as empresas dos próprios projetos. Vale para a Maturidade do RH e para todo o RH Service.

## Situação atual (conferida no banco)
- O cadastro de consultores não tem ligação com o login da pessoa.
- Os projetos do RH Service já têm o campo "consultor responsável", mas as regras de acesso não o usam: basta existir um projeto em andamento na empresa.
- Hoje há 0 consultores, 0 projetos e 0 usuários com papel consultor. Não existem dados antigos para vincular, então nada fica pendente.
- A mesma regra fraca aparece em 3 lugares: Maturidade do RH, acesso do consultor aos dados do Core (cargos, faixas, avaliações, perfis) e leitura/escrita das telas do RH Service.

## O que muda
1. **Consultor ligado ao login:** cada cadastro de consultor passa a apontar para um único login. Um login só pode estar em um cadastro.
2. **Projeto com dono:** o consultor responsável do projeto passa a ser obrigatoriamente um consultor cadastrado. Todo projeto novo precisa ter um dono.
3. **Nova regra de acesso**, igual em todos os lugares:
   - Super admin: vê tudo.
   - Consultor: só vê uma empresa se tiver ali um projeto em andamento **em que ele é o dono**. Um consultor cadastrado mas inativo não vê nada.
   - O RH e o admin do próprio cliente continuam vendo o RH Service da própria empresa, como hoje.
   - Colaborador comum e visitante: nada muda, continuam sem acesso.
4. Isso vale para ver a lista, criar e editar diagnósticos, abrir o scorecard e acessar os dados do Core liberados ao consultor.
5. A tela de consultores ganha um campo "login vinculado". Sem esse vínculo, o consultor não acessa nada.

## Testes (dados fictícios, tudo desfeito ao final)
- Consultor A dono do projeto na empresa X: vê só X.
- Consultor B sem projeto em X: vê 0 diagnósticos de X, e o scorecard é recusado.
- O projeto de X passa para B: A deixa de ver X e B passa a ver. Depois tudo é revertido.
- Super admin continua vendo tudo. Colaborador continua sem ver nada.
- Verificação completa (tipos, lint, testes, build) sem erros.
- Consulta de antes e depois: nenhum resto de teste, e Carlos, Josue e Marli sem nenhuma alteração.

## Publicação
Publico em https://www.compsmart.ia.br só depois que os testes passarem. No roadmap entram a decisão "consultor dono do cliente" e a varredura de segurança completa como etapa obrigatória antes do relançamento comercial.

## Detalhes técnicos
- Migração aditiva: `consultores.user_id uuid UNIQUE` (sem FK para auth.users, conforme o padrão) e FK `rh_service_projetos.consultor_id → consultores.id`. A trigger de validação exige consultor_id em inserts novos.
- Helper `public.consultor_dono_ativo(_tenant uuid)` SECURITY DEFINER: `EXISTS projeto em_andamento JOIN consultores c ON c.id = p.consultor_id WHERE c.user_id = auth.uid() AND c.ativo AND has_role(auth.uid(),'consultor')`.
- Reescrever `maturidade_pode_gerir`, `maturidade_empresas` (via pode_gerir), `has_consultor_modulo_access` (mantém a checagem de assinatura rh-service) e o ramo consultor de `rh_service_can_read`/`rh_service_can_write` usando o helper. O ramo admin/hr_manager de can_read continua igual.
- Revoke de execute do helper para anon. Testes 2 e 3 em DO block com rollback. UI: campo de vínculo no formulário de consultores (select de perfis com papel consultor).
- Registrar a regra em AGENTS.md, substituindo a regra atual de maturidade_pode_gerir.
