# Fase 5 NR-1 — 3 testes pendentes e fechamento

Publicação continua bloqueada. Se algum teste falhar: parar e mostrar antes de corrigir.

## Preparação
- Foto "antes": ciclos reais 9bcaa5df (49,93 Moderado, 400 respostas) e 34820df9 (sem nota, 40 respostas), Carlos, Josue, 2 registros da Marli.
- Criar empresas fictícias A e B e usuários temporários (e-mail de teste): RH de A, admin de A, consultor dono (projeto em andamento na A), consultor sem projeto. Ciclo fictício em A e em B.

## Teste 1 — RH da empresa A
- Na tela (Histórico) e na consulta com a sessão dele: vê o ciclo de A; não vê o de B; endereço direto do ciclo de B mostra "Diagnóstico não encontrado". Captura de tela.

## Teste 2 — Regressão Talent e Maturidade (após a nova trava de módulos)
- Com Talent contratado na A: vagas e Triagem abrem sem erro para admin/RH de A.
- Sem Talent: telas travadas e servidor recusa.
- Maturidade do RH: lista e scorecard abrem para admin/RH de A; nada de outra empresa. Capturas.

## Teste 3 — Consultores
- Consultor dono: vê só a empresa A (NR-1, Maturidade, RH Service); não vê B.
- Consultor sem projeto: 0 ciclos, 0 diagnósticos, scorecard recusado.

## Pontos de atenção
1. Admins internos da CompSmart sem módulos 9-Box/Insight: aguarda sua decisão (contratar na conta interna — recomendado — ou promover a super admin). Nada será mudado sem sua escolha.
2. Logins de teste antigos (teste.nr1.admin, teste.nr1.hr_manager) e os novos desta rodada: apagados no final pela ferramenta de administração do backend; se não for possível, listados para você apagar em Users.
3. Salários do Core visíveis no servidor sem Insight: aceito e registrado no roadmap como item da varredura de segurança.
4. ~100 avisos antigos: continuam como condição antes do relançamento comercial.

## Fechamento
- Limpeza total dos dados fictícios; comparação com a foto "antes".
- bun run ci limpo.
- Tabela esperado × obtido com evidência por linha; roadmap atualizado.
