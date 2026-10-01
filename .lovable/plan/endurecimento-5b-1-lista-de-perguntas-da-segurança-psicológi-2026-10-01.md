# Endurecimento 5B-1 — lista de perguntas da Segurança Psicológica

## Situação confirmada
- **Exposto:** a regra de leitura direta da lista de perguntas da Segurança Psicológica deixa qualquer pessoa logada, de qualquer empresa, ler a lista inteira com o mapa de dimensões.
- **Nenhuma tela do app lê essa lista diretamente.** O único leitor é a função pública do questionário por convite, que roda no servidor com acesso próprio e não depende dessa regra.

## O que muda
1. **Regra de leitura direta restrita:** só leem a lista usuários de empresa com NR-1 contratado e o super admin.
2. **Nova consulta gerencial da lista** no servidor (porta única para RH, admin e consultor): confere empresa com NR-1 ou super admin e devolve as perguntas com o mapa de dimensões. Se negar, grava a tentativa no registro de acessos do NR-1 com o motivo "sem módulo NR-1".
3. **Permanece aberta por necessidade:** a função pública do questionário por convite. Quem recebe o convite continua lendo as perguntas e respondendo, sem login.
4. Nenhum registro de negócio é gravado ou apagado. Nenhuma outra regra muda.

## Testes (esperado × obtido)
1. RH/admin de empresa com NR-1 lê a lista normalmente, pela leitura direta e pela consulta gerencial.
2. Empresa sem NR-1: leitura direta devolve 0 linhas. A consulta gerencial nega e registra a tentativa.
3. Super admin continua lendo.
4. Questionário por convite completo, em empresa fictícia de teste: 51 perguntas aparecem e o envio funciona. Tudo é desfeito depois.
5. Contagens da Etapa 0 inalteradas: auditoria 2 → 2, respostas do diagnóstico 440 → 440, Segurança Psicológica 0 → 0, logins 18 → 18. Os acessos negados do teste ficam identificados, separados dessas contagens, e saem na limpeza.
6. `bun run ci` limpo, aviso de segurança marcado como corrigido, nada publicado.

## Detalhes técnicos
- Migração: remover a política `nr1_segpsi_questoes_read` (USING true) e criar uma política de leitura para quem é autenticado com `public.has_module('nr1') OR public.has_role(auth.uid(),'super_admin')`.
- Nova função `nr1_segpsi_questoes_listar()`: SECURITY DEFINER, `search_path` fixo, liberada para `authenticated`. Em caso de negação, insere em `nr1_access_log` (blocked=true, reason='sem_modulo_nr1', resource='nr1_segpsi_questoes') e lança erro explícito.
- A função `nr1-questionario-publico` usa `service_role`, que não passa por essas regras, então continua igual.
- Registrar a regra em AGENTS.md (lista de perguntas da Segurança Psicológica: só NR-1 ou super admin; questionário por convite só pela função pública) e o item no roadmap.md.
