# Ajustes — Header Público + Contornos dos Cards de Módulos

Escopo: `src/components/landing/public/PublicHeader.tsx` (menu desktop) e `src/components/landing/pivot/ModulesGridSection.tsx` (grade "Nove módulos, nove agentes de IA" da home). Nada muda no app autenticado, no menu mobile, nem em outras páginas.

## 1. CTA "Agendar demonstração" — sólido, sem degradê
- No `DemoDialog` do header (desktop), passar `className` que remove o degradê do botão padrão:
  - `bg-none bg-primary` (azul sólido atual do site, ~#176EA1), `hover:bg-primary/90` (escurece levemente).
  - `hover:-translate-y-0` e sombra contida, para o botão ficar firme e não "flutuante".
- Texto branco e cantos arredondados já garantidos pelo design system.

## 2. "Entrar" — caixinha outline discreta
- Trocar o `variant="ghost"` atual por caixinha com:
  - borda 1px `border-border`, fundo transparente, texto padrão (não azul);
  - hover com fundo claro (`hover:bg-primary/5`) e borda levemente azul;
  - mesmos `size="sm"` e navegação para `/auth`.
- Regra tailwind-merge cuida de sobrepor `border-2/border-primary` do variant outline.

## 3. NR-1 — pílula verde suave
- Retirar "NR-1" da lista `LINKS` e renderizá-lo como item próprio, antes de Preços:
  - fundo `bg-emerald-50` (#ECFDF5), texto `text-emerald-700` (#047857), `font-semibold`;
  - borda 1px `border-emerald-200` (#A7F3D0);
  - formato pílula `rounded-full` com padding horizontal confortável (px-3.5 py-1);
  - hover `hover:bg-emerald-100` (#D1FAE5).
- Sem ícone de escudo (não existe ícone hoje; nada é adicionado).
- No menu mobile, NR-1 permanece como link simples da lista.

## 4. Hierarquia final do header (validação)
- Máximo 2 elementos com caixa: "Entrar" (outline) + "Agendar demonstração" (sólido azul).
- Pílula verde do NR-1 como destaque discreto, sem competir com os botões.
- Demais links (Home, Módulos, Preços, Parceiros, Materiais, Contato) inalterados, com hover.

## Verificação
- Build OK (log em /tmp/observability/build-errors.log).
- Playwright no header em desktop: confirmar visualmente os três estados (CTA sólido, Entrar outline, pílula verde) e que o dropdown Módulos e o dialog de demo continuam funcionando.
