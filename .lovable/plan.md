
# Plano: Alterar "Kudos" para "Reconhecimento"

## Alteração
Atualizar o label do botão de ações rápidas no card de perfil executivo.

## Arquivo a Modificar
**`src/components/performance/ProfileExecutiveCard.tsx`** (linha 18)

## Mudança
```typescript
// De:
{ label: "Kudos", icon: Award, href: "/performance/kudos", color: "text-pink-600" },

// Para:
{ label: "Reconhecimento", icon: Award, href: "/performance/kudos", color: "text-pink-600" },
```

## Justificativa
Seguir a terminologia padrão da plataforma onde "Reconhecimento" substitui "Kudos" para melhor adequação ao contexto cultural brasileiro.
