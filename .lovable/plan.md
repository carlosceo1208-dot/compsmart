
## Ajuste na Faixa Sticky CTA da Landing Page

### O que muda
- Texto atual estatico sera substituido pelo novo conteudo solicitado
- Adicionar animacao de marquee (texto em movimento continuo) para dar destaque visual

### Novo texto
**"2 Ferramentas Estrategicas Completas totalmente customizavel por apenas menos do que R$ 6,00 em media p/ colaborador"**

### Detalhes tecnicos

**Arquivo:** `src/components/landing/StickyCTABar.tsx`

1. Substituir o `<span>` estatico por um container com animacao CSS de marquee (scroll horizontal continuo)
2. Usar `@keyframes` inline ou classe Tailwind com `animate-` customizado para o efeito de texto deslizante da direita para a esquerda
3. Manter o icone Sparkles, o botao "Comecar Agora" e o botao de fechar inalterados
4. Garantir que a animacao nao interfira na responsividade (mobile e desktop)
5. Usar `overflow-hidden` no container do texto para evitar que o conteudo vaze
