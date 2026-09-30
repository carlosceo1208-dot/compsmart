# Rodada final antes do relançamento

Publicação continua bloqueada até sua revisão final.

## Condição 1 — Telas afetadas abertas como RH de A (navegador)
1. Entrar como RH real de A (f19fa2e8) e abrir Vale-transporte, Benefícios, Cenários e Orçamento em 1280px.
2. Para cada tela: capturar imagem, conferir que carrega sem erro (console e rede), que só aparecem dados de A e que as ações principais funcionam (calcular vale, ver elegibilidade, comparar cenários, ver saldo da unidade).
3. Mérito de ponta a ponta: montar um caso completo e válido (colaborador de A, orçamento com saldo, pedido aprovado) e lançar como RH, como admin puro de A e como super admin. Conferir que o saldo baixa e o histórico registra. Tudo dentro de operação desfeita ou, se feito pela tela, com limpeza total ao final e conferência.
4. Se alguma tela quebrar pela mudança do servidor, corrigir e repetir o teste.

## Condição 2 — Itens pendentes do relatório de segurança
1. 21 funções liberadas a visitantes: ler o corpo de cada uma; confirmar que só devolvem o mínimo (link anônimo, vaga pública, preço público) ou fechar.
2. 20 funções sem login obrigatório: conferir se exigem login dentro; corrigir as que não exigem e deveriam.
3. Texto completo das regras de acesso de todas as tabelas: exportar e revisar isolamento por empresa, marcando BLOQUEADOR ou ACEITÁVEL.
4. Salários do Core sem Insight: registrar a justificativa (Core é módulo base) com prova de que comparação de mercado segue travada.
5. Teste ao vivo por papel (visitante, colaborador, RH, admin puro, consultor dono/sem projeto, super admin) contra as tabelas e funções sensíveis, empresa A x B.

## Entrega
- Relatório completo em arquivo (PDF + planilha) por área, com 0 bloqueadores em aberto.
- CI limpo; dados reais intactos (ciclos 9bcaa5df e 34820df9, Carlos, Josue, Marli); zero dado fictício.
- Sem publicar.

## Detalhes técnicos
- Playwright com sessão do RH real; admin puro temporário criado e removido por migração/rollback.
- Correções de funções via migração com checagem rh_admin_da_empresa, EXECUTE revogado de anon/public.
- Relatório em /mnt/documents/relatorio-seguranca-final.pdf e .xlsx.
