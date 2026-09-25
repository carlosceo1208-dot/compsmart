# Limpar sinalização vermelha de leads ao abrir /admin/leads

## Problema
Os badges vermelhos (botão de leads no header, sino de notificações, menu do avatar "CE" e cartão no Painel Plataforma) continuam mostrando o contador mesmo depois de o Super Admin abrir a tela de Leads.

## Solução
Marcar os leads como "vistos" quando a página /admin/leads é aberta, zerando os contadores em todos os lugares.

## Implementação

1. **Registrar a visita**: ao montar a página `src/pages/admin/Leads.tsx`, gravar em `localStorage` a data/hora da última visualização (chave `leads_last_seen_at`, por usuário).

2. **Ajustar o contador** em `src/hooks/useNewLeadsCount.ts`: contar apenas leads com status `novo` **e** `created_at` posterior à data gravada em `leads_last_seen_at`. Sem data gravada (primeiro acesso), conta todos os `novo` — comportamento atual preservado.

3. **Resultado**: assim que o Super Admin abre /admin/leads, os badges vermelhos somem de:
   - Botão de leads na barra superior (HeaderLeadsButton)
   - Sino de notificações (HeaderNotifications)
   - Menu do avatar "CE" (DashboardLayout)
   - Cartão "Leads do Site" no Painel Plataforma (LeadsShortcutCard)

4. **Não altera**: status dos leads no banco (continuam `novo` até você mudar manualmente), textos, formulários, nem nenhuma outra tela.

## Verificação
- Build sem erros.
- Conferir que o contador zera após abrir /admin/leads e volta a aparecer quando um novo lead chegar.
