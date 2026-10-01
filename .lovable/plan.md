# Fase 6 — Fechamento: A9 aprovado + conferência completa

## 1. A9 — selo único nas telas antigas (aprovado com condição de clareza)
- Diagnóstico, Matriz de Risco e Visão Geral do NR-1 passam de "Baixo/Moderado/Alto/Crítico" para "Saudável/Atenção/Crítico", usando a mesma conta da Inteligência (nota de saúde = 100 − risco; 70+ Saudável, 55–69 Atenção, abaixo de 55 Crítico).
- Em cada uma das três telas: nota de rodapé e dica ao lado do selo com o texto "Nota de saúde = 100 − risco psicossocial", para o "Crítico" não parecer erro.
- "Diagnóstico Q1 2026" (risco 49,93) passa a aparecer como nota de saúde 50,1, Crítico.
- Na conferência: prints antes e depois das três telas.
- Dossiê: "A9 aprovado — Diagnóstico Q1 2026 passa de Moderado para Crítico por padronização do selo único; conversão 100 − risco exibida nas telas de Diagnóstico, Matriz de Risco e Visão Geral."

## 2. Teste próprio dos assistentes (A5)
- Teste automatizado e chamada real, numa empresa de teste:
  - empresa sem NR-1: os três assistentes (bem-estar, jornada, plano de ação) devolvem 403 "Módulo não contratado";
  - empresa com NR-1 e sem Clima/Potencial/Insight: o assistente do plano de ação não recebe nem cita dados de cruzamento;
  - empresa com os módulos: funciona normalmente.

## 3. Conferir as exportações abrindo os arquivos
- Gerar o PDF e a planilha, abrir os dois e conferir o cabeçalho: mínimo de 5 pessoas, período, fórmula da nota de saúde, fator 0,5 e salário anual = mensal × 13,33; nenhuma linha com menos de 5 pessoas e nenhum nome.

## 4. Conferência completa em empresa de teste (apagada no final), 1280px e 390px
- Empresas com e sem Clima/Potencial/Insight; sem NR-1; unidade com 5 aparece, com 4 fica oculta; grupo com 5 aparece, com 4 fica oculto; outra empresa vê 0 linhas; consultor com e sem projeto ativo; ordem da lista de prioridades (A7); filtro por unidade; /clima/correlacao abre a aba certa; atalho dentro do Clima.
- Contagens voltam à linha de base (4 acessos, 9 check-ups, 440 respostas, 18 logins, 2 leads; Q1 2026 = 49,93).

## 5. Registros no dossiê
- Aviso de segurança aceito e justificado: as funções nr1_inteligencia_unidades e nr1_clima_correlacao "podem ser executadas por usuário logado" — mesmo padrão já aceito no NR-1: conferem papel, empresa e módulo antes de devolver números, devolvem só agregados com mínimo de 5 e gravam as recusas. Rodar o scan de segurança e nomear o resultado.
- Limitação documentada (não é falha): o diagnóstico é anônimo e não separado por unidade; enquanto não houver diagnóstico por unidade, o cruzamento por unidade usa o risco da empresa. Texto explícito na nota de método da tela e das exportações.
- "Ciclo 2026" com 1 resposta e sem nota: comportamento correto; na empresa real a Inteligência só mostra selo quando um ciclo tiver 5 ou mais respostas.

## 6. Fechamento
- Verificação completa de código limpa; AGENTS.md e roadmap atualizados.
- Nada publicado: publicação só com sua aprovação explícita depois do relatório.

## Detalhes técnicos
- Telas: Nr1Diagnostico, Nr1MatrizRisco, Nr1VisaoGeral passam a usar notaSaude/seloSaude de src/lib/nr1Selo.ts; componente de rodapé compartilhado com o texto de conversão.
- Teste: src/test com casos dos assistentes (respostas 403 e ausência de campos de cruzamento no payload ao modelo).
- Exportações conferidas por leitura do PDF (texto extraído) e do CSV.
