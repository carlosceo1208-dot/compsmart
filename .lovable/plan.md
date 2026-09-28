# Fechamento final da Fase 2 (antes de divulgar)

## Situação atual
- Fase 2 publicada em www.compsmart.ia.br com todos os testes aprovados (candidatura anônima, isolamento entre empresas, candidatura sem currículo, reaplicação bloqueada, trim do título).
- A verificação de segurança usada antes de publicar era anterior às mudanças do dia — precisa ser refeita.

## O que será feito
1. **Nova verificação de segurança**: rodar a varredura completa agora (depois das mudanças de hoje) e relatar o resultado. Em especial, conferir o aviso informativo sobre a lista de códigos CBO: explicar o que ele significa e se exige alguma ação. Se aparecer alerta crítico, corrigir antes de seguir.
2. **Confirmação visual no site publicado** (www.compsmart.ia.br):
   - `/vagas` e `/vagas/consultor-organizacional` abrindo corretamente em janela de desktop (1280 px) e de celular (390 px), com capturas de tela.
   - Conferir que o header mostra os botões (Entrar, Agendar demonstração, links) no desktop e o menu hamburger no celular.
3. **Registro da conclusão**:
   - `roadmap.md`: marcar a Fase 2 como concluída e publicada.
   - `AGENTS.md`: registrar a regra da Fase 2 concluída/publicada (sem duplicar regras já existentes).
4. Relatar o resultado de cada passo.

## Detalhes técnicos
- Varredura via ferramenta de segurança do projeto; confirmação visual via navegador automatizado no domínio publicado.
- Nenhuma mudança de código prevista — só varredura, conferência visual e atualização de `roadmap.md`/`AGENTS.md`. Se a varredura apontar algo crítico, o plano é corrigir e revalidar antes de declarar a fase fechada.
