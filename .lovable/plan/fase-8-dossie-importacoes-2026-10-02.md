# Fase 8 — Dossiê: Importações da Matriz (ciclo de conferência)
Escopo: opção A (conferência). Integração com a Matriz de Risco (opção B) = incremento futuro.
- Status: pendente → conferido | rejeitado; sem reabertura. Gatilho nr1_importacao_transicao.
- Trilha: conferido_por/conferido_em gravados só pelo servidor (valores da tela ignorados).
- Acesso: nr1_importacao_pode_gerir (RH/admin ou consultor dono ativo + has_module nr1).
- Arquivo: link assinado de 10 min, criado no clique; nunca exportado.
## Validação (2026-10-02)
- Banco (desfeito): sem motivo bloqueado; conferir OK; reabrir bloqueado; rejeitar conferida bloqueado; trilha falsa ignorada; hora do servidor.
- Perfis (desfeito): RH=1, outra empresa=0, consultor ativo=1, consultor sem projeto=0.
- Tela (testes automáticos): botões só em pendente; rejeitar sem motivo bloqueado.
- Tela 1280/390: página e estado vazio conferidos.
- Rodada final: importação real temporária criada como pendente e removida ao final; PDF e planilha abertos com período, filtro, aviso de fatores sem dados pessoais e explicação do k=5; sem nomes nem URLs; link abriu imediatamente e expirou após 10 minutos (HTTP 400).
- Logins esclarecidos: 190 é o total histórico; 18 corresponde exatamente a setembro de 2026. A nova linha de base usa 190 e ficou igual antes/depois.
- Empresa sem NR-1: a função de gestão exige has_module('nr1'); não existe hoje RH/admin real fora da única empresa com NR-1. O teste temporário ficou bloqueado porque este acesso não pode criar conta nem reassociar perfil; pendência registrada antes da publicação.

## Teste final — RH/admin de empresa sem NR-1 (2026-10-02)
- Empresa temporária só com Core; admin e RH de teste. Em /nr1/importacoes nas 4 combinações (admin/RH × 1280/390), aparece a trava "Disponível para empresas com Saúde Mental & Bem-Estar (NR-1) contratado". Nenhuma lista de importações e nenhum erro de servidor. Para o RH, o consentimento LGPD aparece antes, que é o fluxo normal.
- No banco, com a sessão de cada um: 0 importações e 0 arquivos, sem erro.
- Limpeza: a empresa, o módulo, os alertas automáticos e os papéis foram apagados. As 2 contas de login de teste ficaram inativas, sem empresa e sem papel, porque não há acesso de servidor para apagá-las.
- Contagens depois: 25 · 2 · 440/0/0 · 9 · 190 · 2 · 0 importações. Q1 2026 = 49,93 (10 respondentes).
