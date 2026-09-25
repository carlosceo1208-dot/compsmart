# Corrigir erro "Algo deu errado" no Dashboard

## O que acontece
O aviso de novos leads roda em vários lugares da tela ao mesmo tempo: o ícone na barra superior, o sino e o menu do seu nome. Cada um tenta abrir a mesma "escuta" de novos contatos com o mesmo nome. Quando o segundo tenta, o sistema recusa e a tela inteira quebra. Isso só afeta contas Super Admin, por isso só você vê o erro.

## Correção
- Cada lugar passa a usar sua própria escuta, com um nome único, e a fecha corretamente ao sair da tela.
- Se a escuta em tempo real falhar, o contador continua funcionando com a atualização a cada 60 segundos, e o Dashboard nunca quebra.
- Nada muda no visual, nos textos ou nos dados. O lead da Marli continua intacto.

## Verificação
- Abrir o Dashboard e o Painel Plataforma e confirmar que não aparece mais o erro nos registros.
- Publicar depois da correção.

## Detalhes técnicos
- `src/hooks/useNewLeadsCount.ts`: trocar `supabase.channel("new-leads-count")` por um nome único por instância (ex.: `new-leads-count-${useId()}` ou sufixo aleatório em `useRef`), registrar `.on(...)` antes de `.subscribe()` num canal novo, e envolver em try/catch para nunca lançar dentro do effect. Cleanup com `supabase.removeChannel(channel)`.
