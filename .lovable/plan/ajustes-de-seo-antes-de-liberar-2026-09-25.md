# Ajustes de SEO antes de liberar

Este plano responde aos 5 pontos enviados e ao checklist. Parte deles já está publicada e verificada no site oficial.

## 1. Painel NR-1 (/nr1/...) depois da cópia de HTML por página: já verificado, sem risco
- No site publicado, `/nr1/painel` e `/nr1/diagnosticos` responderam 200 e carregaram o aplicativo normal, sem 404.
- A hospedagem da Lovable já envia qualquer endereço que não seja arquivo para o aplicativo. Não é preciso configurar nada.
- O arquivo `_redirects` sugerido não é lido por esta hospedagem, porque é um padrão de outro provedor. Por isso, não vou incluir as regras `/nr1/*` e `/*`: elas não teriam efeito.
- Ação: nenhuma mudança. Vou refazer o teste depois de publicar.

## 2. og:image absoluta: já correta
Todas as páginas usam `https://www.compsmart.ia.br/compsmart-social.png` (conferido no site publicado). Ação: nenhuma mudança.

## 3. Canonical no navegador como reserva: já existe
Cada página pública coloca seu próprio canonical também no navegador. O `index.html` base não tem canonical fixo. Ação: incluir um canonical de reserva para qualquer página pública fora da lista. Ele aponta para o próprio endereço da página, sem parâmetros.

## 4. Títulos com a palavra-chave no início
Ajustar os títulos que hoje não começam pela palavra-chave, mantendo 50 a 60 caracteres:
- `/nr1` → "NR-1 e Riscos Psicossociais: Diagnóstico COPSOQ | CompSmart"
- `/plano-de-cargos-e-salarios` → "Plano de Cargos e Salários com IA para Empresas | CompSmart" (já começa pela palavra-chave, fica como está)
- `/sobre-nos` → "Sobre a CompSmart: Gestão Estratégica de Pessoas com IA"
- `/parceiros`, `/contato`, `/materiais`: revisar para começarem pela palavra-chave, como "Parceiros e Consultores de RH | CompSmart" (completando até 50 caracteres).
Os demais já começam pela palavra-chave.

## 5. lastmod no sitemap: continuar sem data
Vou manter o sitemap sem data de atualização. Usar a data da publicação faria todas as páginas parecerem alteradas a cada publicação, mesmo sem mudança no conteúdo, e o Google passa a desconfiar desse sinal. O Google aceita sitemap sem essa data.

## 6. /modulos/nr1 com 301: limitação conhecida
No teste, `curl -I /modulos/nr1` retornou 200, não 301. A hospedagem não permite redirecionamentos no servidor. O que já está no ar tem o mesmo efeito prático para o Google: o código-fonte declara `/nr1` como página oficial e o visitante é levado para lá. Um 301 verdadeiro só seria possível com a migração para renderização no servidor (TanStack Start).

## Validação pós-publicação
- `curl` em cada uma das 19 páginas: title, description e canonical próprios.
- `/nr1/painel`, `/nr1/diagnosticos` e `/nr1/diagnostico/novo` carregam o aplicativo (200).
- `/modulos/nr1` com canonical para `/nr1`. O resultado esperado é 200, e não 301, pela limitação do item 6.
- `/sitemap.xml` sem páginas privadas e `/robots.txt` com a linha do Sitemap.
- Preview no WhatsApp: vou conferir as tags de compartilhamento pelo código-fonte da Home e de uma subpágina. O teste real no WhatsApp fica com você.

## Detalhes técnicos
- `src/config/seoRoutes.ts`: atualizar os títulos do item 4.
- `SeoHead`: canonical de reserva para páginas públicas fora da lista.
- Sem mudanças em `_redirects`, no sitemap nem no layout.
