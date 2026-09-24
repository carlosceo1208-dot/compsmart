# Quem Somos: card "Nossa História" + bio do Josué

## 1. "Nossa História" vira card de destaque
- Os 3 parágrafos ficam dentro de um card: fundo branco (escuro no tema Dark), borda leve na cor da marca, faixa decorativa de 4px à esquerda, cantos 20px (como os cards dos sócios), padding 32px no desktop / 24px no celular, sombra suave.
- Cabeçalho interno: ícone de aspas grandes + título "Nossa História" com peso maior.
- Nomes em negrito em todas as ocorrências: **Josué Cruz**, **Fernando Curral**, **Carlos Eduardo**.
- A moldura da Imagem A continua ao lado (desktop) e abaixo (celular); espaçamento simétrico entre a abertura e os sócios.
- O texto dos parágrafos não muda.

## 2. Bio do Josué
Substituir pelo texto enviado, exatamente:
"Psicólogo, Executivo com sólida carreira em Telecomunicações, Indústria, Varejo/Franquias e Serviços Jurídicos. Transita com naturalidade entre a visão estratégica de conselho e a implementação tática, protegendo e impulsionando a performance sustentável por meio das pessoas — pela Vitalidade: o equilíbrio entre resultados robustos e a preservação da energia humana."
Nome, cargo e botão do LinkedIn sem alteração.

## 3. Fotos reais dos sócios
Trocar as iniciais pelas fotos enviadas, em círculo 1:1 com corte centralizado no rosto:
- 1ª foto: Josué Cruz
- 2ª foto: Carlos Eduardo
- 3ª foto: Fernando Curral
A ordem dos cards continua a mesma: Carlos, Fernando, Josué.

## 4. Conferência
Capturas de tela em desktop e celular, nos temas claro e escuro, checando contraste do card.

## Detalhes técnicos
- Arquivo: src/pages/AboutUs.tsx. Cores via tokens (bg-card, border-primary/15, border-l-primary), ícone Quote do lucide.
- Fotos enviadas pelo CDN (lovable-assets): image-27 = Josué, image-28 = Carlos, image-29 = Fernando; preenchem o campo `foto` de cada sócio. Adicionar a tarefa em roadmap.md.
