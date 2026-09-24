# Download do e-book "Remuneração Estratégica" em /materiais

## O que muda para o visitante
- Clicar em "Baixar" no card de Remuneração Estratégica abre uma janela com só 2 campos: Nome* e E-mail corporativo*, mais uma caixinha obrigatória: "Concordo em receber conteúdos e contato comercial da CompSmart, conforme a LGPD."
- O botão "Baixar e-book" só fica ativo quando o nome está preenchido, o e-mail é válido e a caixinha está marcada.
- Depois do envio, o download começa sozinho e aparece "Pronto! Faça o download do seu e-book." com o botão "Baixar e-book" (link direto para o PDF).
- Se o e-mail já estiver cadastrado, o download é liberado na hora, sem criar um contato repetido.
- Se der erro: "Não foi possível concluir. Tente novamente."
- Fechar (X ou clique fora) volta a janela ao estado inicial.
- Nada mais muda: títulos, textos, ícones (o símbolo continua), ordem dos cards, os outros cards e as outras páginas ficam como estão.

## Detalhes técnicos
- PDF enviado registrado via lovable-assets -> `src/assets/ebook-remuneracao-estrategica.pdf.asset.json`.
- Migração: função `public.capture_ebook_lead(_nome text, _email text, _origem text)` SECURITY DEFINER, com `set search_path = public`. Ela valida o tamanho e o formato do nome e do e-mail, verifica se o e-mail já existe (sem diferenciar maiúsculas e minúsculas, em qualquer origem) e, se for novo, grava com `consentimento_lgpd = true`. Retorna só um booleano (`existed`) e nunca devolve dados do contato. Terá GRANT EXECUTE para anon e authenticated. O limite de envios atual (`leads_throttle`) continua ativo.
- Origem: `materiais-ebook-remuneracao` (adicionada ao tipo `LeadOrigem`).
- Novo componente `EbookDownloadDialog.tsx` (validação com zod, largura máx. 480px, cantos 16px, estado reiniciado ao fechar); `Materiais.tsx` passa a usá-lo só no card de remuneração.
- Download automático por meio de um link âncora com a URL do CDN, mais um botão de reserva.
- Testes com Playwright em desktop e celular: fluxo com e-mail novo, e-mail repetido (conferir no banco que não houve duplicação) e botão desativado.
