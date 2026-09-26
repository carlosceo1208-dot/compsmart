# Família e nível sugeridos ao cadastrar o cargo na biblioteca

## O que aconteceu
"Advogados" foi aceito. O aviso apareceu porque o campo **Nível / grade** estava vazio, e o sistema exige os dois campos.

## O que muda
- **Família do cargo**: lista com as famílias que a empresa já tem. Se a família não existir, o RH digita o nome e ela é criada. O campo já vem com uma sugestão tirada da área da vaga (ex.: "Jurídico" para advogado).
- **Nível / grade**: já vem preenchido de acordo com a senioridade da vaga (Júnior → I, Pleno → II, Sênior → III, Especialista → IV). O RH pode mudar.
- Uma nota curta abaixo dos campos: "Sugestão automática — ajuste se necessário."
- Se o RH trocar a senioridade, o nível sugerido muda junto, a menos que o RH já tenha editado o campo.
- A mensagem de erro passa a dizer qual campo está faltando.

## Detalhes técnicos
- `VagaDialog.tsx`: carregar `job_families` da empresa ativa (`activeCompanyId`) e usar um combobox que aceita texto livre; sugerir a família pela área (ou pela família mais parecida). Um sinalizador "editado" impede que a sugestão sobrescreva o que o RH escreveu.
- **Família nova sem duplicar**: antes de inserir em `job_families`, conferir se a empresa já tem uma família com o mesmo nome, sem diferenciar maiúsculas de minúsculas. Se já existir, usar essa família em vez de criar outra.
- **Mapa senioridade → grade**: fica numa única constante documentada (`SENIORIDADE_GRADE_PADRAO`), pensada para receber no futuro um mapa próprio por empresa. O RH sempre pode sobrescrever o valor.
- Continua usando a RPC `talent_link_or_create_job_title`. Nenhuma mudança na estrutura do banco. Família nova entra em `job_families` pelas regras de acesso que já existem.
- Rodar lint, typecheck, test, dead-code e build. Testar o fluxo "Advogado" no navegador em 3 cenários:
  - (a) família existente + nível sugerido;
  - (b) família nova + nível editado (conferindo que digitar "juridico" em outra grafia não duplica a família);
  - (c) trocar a senioridade depois de preencher: o nível editado não pode ser sobrescrito.
