# Fechar as 2 lacunas + 4 itens pendentes (sem publicar)

## Lacuna 1 — Admin puro (sem super admin)
- Criar temporariamente um login de teste com papel **admin apenas** (sem super admin), numa empresa fictícia com NR-1 contratado e 1 ciclo fictício; outra empresa fictícia com outro ciclo.
- Entrar com esse login no navegador: deve ver o ciclo da própria empresa e **não** o da outra. Confirmar também pela consulta com a sessão dele.
- Apagar login, empresas e ciclos fictícios no final.
- Se a criação não for possível, registrar no roadmap: "admin puro — garantido por código, não testado por login".

## Lacuna 2 — Histórico aberto na tela como RH
- Mesmo método: login RH de teste (sem super admin) numa empresa fictícia com um ciclo <5 respostas e um com 7.
- Abrir Histórico e comparação no navegador: captura de tela, sem erro, ciclo pequeno com "Dados insuficientes (menos de 5 respostas)", sem variação calculada.

## Os 4 itens pendentes (navegador)
1. Telas de quem responde: captura e texto exato de link inválido, expirado, reenvio e envio duas vezes.
2. Clima/FIB: FIB como bloco do Clima com perguntas preservadas; aba avulsa removida; /nr1/fib e /nr1/fib-bem-estar redirecionam.
3. Card em 1280 e 390 px: 4 blocos, Acompanhamento em "Acompanhar", Plano Essencial em "Preparar", gaveta com 7 itens, Biblioteca/Auditoria no rodapé.
4. PGR e laudo: exportar em PDF e Excel e conferir os arquivos gerados.

## Fechamento
- `bun run ci` limpo; comparação com a foto "antes" (Carlos, Josue, 2 registros da Marli, ciclos reais 34820df9 e 9bcaa5df).
- Tabela "esperado x obtido" com evidências; o que falhar, paro e mostro antes de corrigir.
- Roadmap atualizado. Publicação continua bloqueada.

## Detalhes técnicos
- Logins de teste criados com a chave de serviço (e-mail @example.test), papel em user_roles, profile com company_id da empresa fictícia e módulo nr1 ativo; sessão gerada por `lovable auth-session --user` ou login por senha temporária no Playwright.
- Limpeza por ids registrados: auth user, user_roles, profiles, subscriptions, diagnósticos, respostas, empresas fictícias.
