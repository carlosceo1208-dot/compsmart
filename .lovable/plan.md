# Correção de acesso do NR-1 + relatório completo (sem publicar)

## 1. Corrigir a regra de acesso do NR-1
- Mesma regra da Maturidade do RH: super admin, OU consultor dono ativo de projeto em andamento na empresa, OU RH/admin da própria empresa com o NR-1 contratado.
- Colaborador comum, consultor sem projeto e visitante continuam sem acesso.

## 2. Teste de acesso (dados fictícios, desfeitos no final)
- RH da empresa: vê os ciclos da própria empresa e não vê os de outra.
- Admin da empresa: idem.
- Consultor dono: vê só a empresa do projeto dele.
- Consultor sem projeto: 0 ciclos.
- Colaborador sem módulo: 0. Visitante: 0.
- Inclui a abertura do Histórico no navegador com o login do RH.

## 3. Relatório completo (itens pendentes)
- Mensagens na tela de quem responde: captura e texto exato para link inválido, link expirado, reenvio e envio duas vezes no mesmo navegador.
- Histórico e comparação de ciclos com ciclo sem nota: "Dados insuficientes (menos de 5 respostas)", nunca "0", erro ou tela em branco. Ajuste só onde faltar.
- Clima/FIB, cruzamentos (tela + servidor), card em 1280 e 390 px, rotas, PGR e laudo em PDF e Excel.
- `bun run ci` limpo; comparação final com a foto "antes" (Carlos, Josue, Marli, ciclos reais).

## 4. Roadmap
- Registrar o alerta novo como "aceito com justificativa": consulta de resultado por grupo para usuários logados, exige permissão de gestão e aplica k=5 no servidor.
- Manter a varredura de segurança completa (incluindo os ~100 alertas antigos) como etapa obrigatória antes do relançamento comercial.

Entrega: tabela "esperado x obtido" com evidências. Se algo falhar, paro e mostro. Publicação continua bloqueada.

## Detalhes técnicos
- Migration: recriar `nr1_pode_gerir` como SECURITY DEFINER com `set search_path = public`: `is_super_admin() OR consultor_dono_ativo(_tenant) OR ((has_role(auth.uid(),'admin') OR has_role(auth.uid(),'hr_manager')) AND get_user_company_id() = _tenant AND has_module('nr1'))`, conferindo antes a assinatura atual. Revogar EXECUTE de anon.
- Testes de papel em DO block com rollback (set local role/request.jwt.claims); navegador via Playwright com sessão temporária.
