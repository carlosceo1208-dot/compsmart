# Fase 10 — Dossiê
- Auditoria: nr1_sociodemo_results/nr1_fib_results/nr1_segpsi_results não existem; respostas sem demografia; cruzar cadastro × resposta quebraria anonimato (recusado).
- Parte 1 feita: corCelula <50 = vermelho. Exportação CSV usa recortes já filtrados por aplicarKAnonimato; PDF captura a tela já suprimida; ambos registram acesso (sociodemo).
- Parte 2 pendente de aprovação: bloco opcional no final, faixas fixas, área de organizational_structure (vazia → só "Prefiro não informar"), parâmetro só em nr1_submeter_completo, rótulo de área gravado no envio, upsert por empresa+ciclo, k≥5, sem contagem por grupo na tela.
- Pendência transversal registrada: FIB e SegPsi vazias para cliente real; 0 respostas SegPsi/Vitalidade na linha de base.

## Parte 2 — implementada e validada (prévia)
- Banco: nr1_sociodemo_envios (sem leitura direta), nr1_sociodemo_results (único por empresa+ciclo), nr1_areas_empresa (todas as unidades da árvore), nr1_submeter_completo com p_demografia opcional (valores fora das listas viram nulo), nr1_sociodemo_consolidar + gatilho ao concluir.
- Sinalizado: FIB e HSE não são coletados pelo questionário — a tela mostra "—" (sem números inventados). Só Seg. Psi. é real.
- Testes (empresa temporária, apagada): 12 envios + 1 em empresa sem áreas, todos 200. Feminino(6) e Até 29 anos(6) exibidos; Masculino(4) suprimido na tela e no CSV; área inventada descartada; sem perfil e "Prefiro não informar" concluem; empresa sem áreas recebe lista vazia e conclui. Reprocessar = 1 registro. Renomear área após fechamento: recorte antigo preservado ("Operações T10"). Tela 1280/390 e recarregar ok. CSV aberto: 3 linhas, sem grupo suprimido. PDF é captura da mesma tela já suprimida.
- Linha de base: 25 · 2 · 440/0/0 · 9 · 192 logins (+2 = login real de um usuário às 20:11, não de teste) · 2 · Q1 2026 = 49,93.
- Conta teste.fase8.admin segue inativa, sem empresa e papel.
