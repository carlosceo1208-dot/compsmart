# Fase 5B-3 — Incremento 1: validação visual antes de publicar

Registro no dossiê:
- Linha de base: 4 acessos e 9 check-ups. A causa são as 2 ações reais do CEO às 20:10 UTC, que não foram apagadas.
- Aviso de segurança da lista de grupos: aceito.
- Passo 3 (reativação do NR-1): fechado.

## Montagem (empresa de teste, removida no final)
- Empresa "QA 5B3 Grupo", com NR-1 ativo e sem Clima.
- 1 login de RH e 17 colaboradores com check-up recente:
  - 5 sem área, grupo G1 → deve aparecer como "Grupo";
  - 4 sem área, grupo G2 → deve ficar oculto;
  - 5 com área "Vendas" → deve aparecer como "Área";
  - 2 sem área e sem grupo → devem cair em "Sem recorte — média da empresa".
- 1 colaborador extra sem jornada, para testar o início.
- Grupos G1 e G2 cadastrados na lista da empresa.

## Conferência na tela (1280px e 390px)
1. **RH** abre Check up Semanal → "Visão de conjunto". Print e leitura do texto da página. Confirmar:
   - etiqueta "Área" em Vendas e "Grupo" em G1;
   - aviso de "1 recorte oculto" (G2 com 4) e G2 sem nenhuma nota visível;
   - linha "Sem recorte — média da empresa" com 2 pessoas;
   - média da empresa e selo.
2. **Colaborador extra** abre Minha Jornada:
   - antes do clique, 0 jornadas no banco;
   - o seletor "Meu grupo (opcional)" mostra "Prefiro não informar", G1 e G2;
   - escolhe G1, clica em "Iniciar" e a jornada é gravada com G1;
   - no topo da jornada, o seletor mostra G1.
3. Prints de cada passo nos dois tamanhos, guardados em fase-5b3-acompanhar/prints-incremento/.

## Encerramento
- Remover tudo o que é de teste.
- Contagens iguais à linha de base:
  - acessos 4, auditoria 2;
  - respostas 440/0/0;
  - logins 18;
  - jornadas 4, mensagens 16, check-ups 9;
  - leads 2.
  - Diferença causada por ação real do CEO é registrada, não apagada.
- `bun run ci` limpo.
- Relatório atualizado (esperado × obtido, com os prints).
- **Nada publicado** até aprovação explícita.

## Registro do CEO (20:39 UTC, pós-conferência)
- Correções de mobile durante a conferência (nome da área cortado, botões do topo da jornada passando da borda) registradas como o ciclo de validação funcionando direito — corrigidas e reconferidas.
- Linha "Sem recorte — média da empresa" com 2 pessoas sem nota: registrado como correto. A contagem aparece; a nota só a partir de k=5.
- Obs.: o arquivo do relatório e a pasta de prints foram removidos com a empresa de teste; o registro do resultado visual fica neste dossiê.
