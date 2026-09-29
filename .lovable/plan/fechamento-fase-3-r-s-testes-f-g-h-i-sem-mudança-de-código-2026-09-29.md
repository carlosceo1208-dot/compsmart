# Fechamento Fase 3 R&S — testes F, G, H, I (sem mudança de código)

## Preparação
- Registrar estado inicial: Carlos (72) e Josue (74) em Triagem, ativos; empresa/papel do usuário de teste.
- Criar "Vaga Teste QA — apagar após" (publicada) na empresa A, com 3 candidatos fictícios (2 PDFs legíveis + 1 só-imagem). Carlos e Josue nunca entram no lote.

## F — Troca de vaga no meio do lote
Disparar lote de 3 na vaga de teste, trocar para a vaga real no seletor com 2 em voo.
Aprova: as 2 em voo concluem e gravam; a 3ª não inicia; tela sem erro.

## G — Botão oculto sem permissão
Entrar como colaborador (652e57b6…) e conferir que "Analisar currículos (N)" e o sparkle do card não aparecem.
Se aparecerem: parar e reportar (seria mudança de código, precisa aprovação separada).

## H — Usuário de outra empresa
Mover temporariamente o usuário de teste para empresa B temporária com módulo de R&S ativo. Tentar abrir currículo e analisar a candidatura de Carlos/Josue da empresa A.
Aprova: currículo recusado, análise 403, nada gravado. Reverter e confirmar que ele volta a ver tudo na empresa A.

## I — Troca de empresa no meio do lote
Disparar lote na empresa A (vaga de teste) e trocar para B durante o processamento.
Aprova: fila visual descartada, nenhum status de A aparece em B.

## Limpeza e validação final
- Apagar vaga de teste, candidaturas, candidatos fictícios, históricos e currículos.
- Reverter usuário e remover empresa B temporária.
- Consulta final: só Carlos (72) e Josue (74), em Triagem, ativos.
- Não publicar. Atualizar roadmap.md marcando o fechamento da Fase 3.

## Detalhes técnicos
- Troca de empresa via update em profiles.company_id + user_roles temporário, com snapshot antes e restauração exata depois.
- Testes de UI por Playwright com sessão mintada; H também por chamada direta a curriculo-download e agent-talent.
