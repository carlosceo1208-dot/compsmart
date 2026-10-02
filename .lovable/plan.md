# Fase 9 — Gestão de Terceiros (PGR): revisão e ajustes

## O que a auditoria encontrou
- **Persistência (D4):** as colunas já existem no banco com outros nomes: `grau_risco`, `emergencia_nome`, `emergencia_telefone`, `emergencia_email` e `contrato_inicio`. O formulário já envia esses campos e os relê ao abrir. Só o tipo `Terceiro` do hook não os declara, e o envio passa por `as any`. Não é preciso criar coluna. O ajuste é declarar os campos no tipo e tirar o `as any`. O teste de cadastrar → recarregar comprova que salva.
- **Acesso (D2):** hoje só Admin/RH da própria empresa (e o super admin dentro da empresa ativa) leem e alteram. Isso vale para as duas tabelas e para os arquivos. **Faltam duas coisas do padrão NR-1:**
  1. a trava `has_module('nr1')`: uma empresa sem NR-1 ainda acessaria os dados direto pelo banco;
  2. o consultor dono de projeto ativo, que hoje não vê nada.
- **Terceiro:** não há login, convite nem área para terceiros. Está correto e fica assim.
- **Downloads (D3):** o PGR baixa por link assinado de 60 s, em bucket privado. O Relatório de Conformidade é gerado na hora. Os dois já estão ligados na lista.
- **Hoje existem 0 terceiros e 0 PGRs no banco.** Nada precisa ser migrado.

## O que vou fazer
1. **Tipo e envio:** declarar os 5 campos em `Terceiro` e retirar o `as any` do formulário. Nada muda na tela.
2. **Travas no banco, sem apagar dados:** uma função `nr1_terceiros_pode_gerir(company)`, no mesmo molde de `nr1_importacao_pode_gerir`:
   - Admin/RH da empresa, ou consultor dono ativo;
   - sempre com `has_module('nr1')`; o super admin passa, como já é a regra.
   - As políticas de leitura e escrita das duas tabelas e do bucket passam a usar essa função. A exclusão de terceiro continua só para o admin, como hoje.
3. **Relatório de Conformidade:** incluir o grau de risco NR-4 e o início do contrato na ficha. Aplicar `aplicarFonteUnicode`, porque hoje o texto pode quebrar símbolos como "≤". O checklist e as regras do relatório ficam como estão.
4. **Revisão leve de tela:** máscaras (CNPJ e telefone), estados de vazio e carregando, a mensagem de CNPJ duplicado. Conferir em 1280 e 390. Só corrijo detalhes pontuais.
5. **Registros:** AGENTS.md (uma regra de acesso aos Terceiros), roadmap e dossiê da Fase 9.

## Pontos sinalizados, não implementados (decisão do CEO)
- O relatório mostra "Conformidade geral" de 100% / 70% / 0% (válido / vencendo / vencido) e o rodapé diz "Validade: 30 dias". São regras antigas, sem base definida. Mantenho como está, salvo se o CEO pedir mudança.
- O link do PGR dura 60 s. Mantenho; é mais curto que os 10 min das Importações.

## Validação (empresa de teste, apagada ao final; 1280 e 390)
- Cadastrar terceiro com grau de risco, contato de emergência e início do contrato → recarregar → os dados voltam.
- CNPJ duplicado bloqueado, com a mensagem atual.
- Anexar PGR com emissão e vencimento → baixar → o link expira depois de 60 s.
- Gerar e abrir o Relatório (checklist completo, status correto, acentos certos).
- Acesso: Admin/RH veem; outra empresa vê 0; consultor sem projeto vê 0, e com projeto ativo vê; empresa sem NR-1 vê 0 no banco e a trava na tela.
- Linha de base ao final: 25 · 2 · 440/0/0 · 9 · 190 · 2 · Q1 2026 = 49,93.
- `bun run ci` limpo.
- Nada publicado sem aprovação do CEO.

## Não muda
Matriz de Risco, Importações, leitor de matriz, selo único e os demais módulos.
