# Remover os 2 logins de teste do NR-1

Alvo: `teste.nr1.admin@compsmart.ia.br` e `teste.nr1.hr_manager@compsmart.ia.br` (sem papel, sem empresa).

## Passos
1. Conferir antes: listar os usuários de login (total, e-mails) e registrar Carlos, Josue, Marli, ciclos reais do NR-1.
2. Remover pela via oficial de administração (`auth.admin.deleteUser`), com uma função temporária do servidor que:
   - só aceita os 2 e-mails fixos no código (nenhum outro pode ser apagado);
   - só roda com login de super admin;
   - apaga também sobras ligadas a esses 2 ids (perfil, papéis, sessões), se existirem.
3. Plano B, se a remoção for recusada: banir os 2 logins (`ban_duration` até 2099) pela mesma via.
4. Apagar a função temporária logo depois do uso.
5. Conferir depois: total de usuários restantes (antes − 2), os 2 e-mails não existem mais, Carlos/Josue/Marli e os 2 ciclos do NR-1 intactos, nenhuma outra tabela alterada.

## Detalhes técnicos
- O acesso direto ao esquema de login pelo terminal é recusado neste ambiente, por isso a via é a função temporária com service role.
- Nada é publicado; sem mudança de tela ou regra.
