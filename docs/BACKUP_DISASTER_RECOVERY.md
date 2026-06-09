# 🛡️ Backup & Disaster Recovery — CompSmart

> **Para quem é este documento:** Você (fundador/admin), em linguagem simples.
> **Objetivo:** garantir que, se algo der errado, **nenhum dado de cliente seja perdido** e a plataforma volte ao ar rapidamente.

---

## 📊 Metas oficiais (RPO/RTO)

| Métrica | O que significa | Meta CompSmart |
|---|---|---|
| **RPO** (Recovery Point Objective) | Quanto dado pode ser perdido no pior caso | **≤ 24 horas** |
| **RTO** (Recovery Time Objective) | Quanto tempo para voltar ao ar | **≤ 4 horas** |

Tradução: se o banco explodir agora, você consegue restaurar uma versão de no máximo **24h atrás** em até **4h** de trabalho.

---

## 🔄 1. Backups automáticos (Lovable Cloud / Postgres)

### Backup diário nativo
- Lovable Cloud (Supabase) faz **snapshot diário automático** do banco inteiro.
- Retenção: **7 dias** no plano atual (Free/Pro). Planos pagos = até 30 dias com PITR.
- **Você não precisa fazer nada** — está rodando agora.

### Point-in-Time Recovery (PITR) — recomendado quando ultrapassar 10 clientes pagos
- Permite restaurar para **qualquer minuto** dos últimos 7-30 dias (não só "ontem às 3h").
- Disponível no plano Pro do Supabase. Custo: ~US$ 100/mês extra.
- **Quando ativar:** quando MRR > R$ 5.000 ou primeiro cliente Enterprise.

### Como verificar que o backup está rodando
Em **Connectors → Lovable Cloud → Database → Backups** você vê a lista de snapshots.

---

## 📤 2. Backup externo (defesa em profundidade)

Backup nativo protege contra **falha técnica**. Mas e se a conta Lovable for suspensa, hackeada, ou houver um bug de exclusão em massa? Por isso recomendo um **export semanal externo**.

### Estratégia "3-2-1" (padrão de mercado)
- **3** cópias dos dados
- **2** mídias diferentes (banco + arquivo)
- **1** cópia fora do provedor principal

### Implementação sugerida (futura, quando tiver 20+ clientes):
1. Edge function `weekly-backup-export` roda toda segunda-feira 03:00 UTC.
2. Exporta todas as tabelas críticas em CSV/JSON criptografado.
3. Envia para **AWS S3** (bucket `compsmart-backups`) ou Google Cloud Storage.
4. Retenção: 90 dias (último mês completo + 8 semanas).

**Custo estimado:** US$ 2-5/mês até 50 clientes. Vale cada centavo.

---

## 🚨 3. Cenários de desastre e procedimentos

### Cenário A: "Apaguei sem querer uma tabela inteira"
**Probabilidade:** baixa. **Impacto:** alto.

1. **NÃO entre em pânico, NÃO mexa em mais nada.**
2. Acessar Connectors → Lovable Cloud → Database → Backups.
3. Identificar o snapshot anterior ao incidente.
4. Clicar em "Restore" para um banco temporário.
5. Copiar a tabela perdida do banco temporário para o banco de produção (via `INSERT ... SELECT`).
6. **Não restaurar o snapshot por cima do banco atual** — você perderia os dados das últimas horas.

**Tempo estimado:** 1-2h.

### Cenário B: "Banco inteiro corrompido / inacessível"
**Probabilidade:** muito baixa (Supabase tem 99.9% SLA). **Impacto:** crítico.

1. Verificar status oficial em https://status.supabase.com
2. Abrir ticket no suporte Lovable + Supabase (paralelo).
3. Se for falha de horas: aguardar (Supabase restaura sozinho).
4. Se for falha de dias: solicitar restore do último snapshot diário.
5. Comunicar clientes via email (template pronto abaixo).

**Tempo estimado:** 2-4h.

### Cenário C: "Cliente apagou seus próprios dados por engano"
**Probabilidade:** média. **Impacto:** médio (afeta 1 cliente).

1. Pedir ao cliente confirmação escrita (email) do que foi perdido.
2. Como super_admin, acessar `audit_logs` para reconstruir a ação.
3. Restaurar snapshot em banco temporário, extrair APENAS os dados daquele `root_company_id`.
4. Importar de volta com `INSERT ... ON CONFLICT DO NOTHING`.

**Tempo estimado:** 2-3h. **Cobrar como serviço** (R$ 500-1.500) se for negligência do cliente.

### Cenário D: "Conta Lovable suspensa / problema comercial"
**Probabilidade:** baixíssima. **Impacto:** existencial.

**Mitigação preventiva:**
- Manter cartão de crédito sempre atualizado.
- Domínio `compsmart.ia.br` registrado fora do Lovable (Registro.br).
- Código-fonte sincronizado com **GitHub** (já está, via integração).
- Backup externo semanal (item 2 acima).

**Se acontecer:** clonar repositório GitHub → fazer self-hosting em VPS + restaurar backup externo. Tempo: 1-2 dias.

---

## 📧 4. Comunicação com clientes em incidente

Template de email pronto:

```
Assunto: [CompSmart] Aviso de manutenção emergencial

Olá [Nome],

Identificamos um incidente técnico que afetou temporariamente o acesso à plataforma 
CompSmart entre [HH:MM] e [HH:MM] de hoje.

Nenhum dado da sua empresa foi perdido — todos os backups foram preservados.

Já realizamos a recuperação completa e o sistema está operando normalmente.

Detalhes técnicos completos serão publicados em até 48h em compsmart.ia.br/status.

Pedimos desculpas pelo transtorno.

Equipe CompSmart
```

---

## ✅ 5. Checklist mensal (5 minutos por mês)

No primeiro dia útil de cada mês, verificar:

- [ ] Connectors → Lovable Cloud → Database → Backups mostra **snapshots dos últimos 7 dias**?
- [ ] Cartão de crédito do Lovable está válido (não vence nos próximos 60 dias)?
- [ ] Domínio `compsmart.ia.br` está pago (validade > 60 dias)?
- [ ] Integração GitHub está sincronizando (último commit aparece no repo)?
- [ ] Algum cliente reportou perda de dados no mês? (revisar suporte)

---

## 🔮 6. Roadmap de evolução

| Quando | Ação | Custo |
|---|---|---|
| **Agora (0-10 clientes)** | Backup nativo Supabase (já ativo) | R$ 0 |
| **10-30 clientes pagos** | Ativar PITR + Backup externo S3 semanal | ~US$ 105/mês |
| **30-50 clientes pagos** | Backup externo **diário** + região secundária | ~US$ 200/mês |
| **50+ clientes / Enterprise** | Multi-region replicação + DR drill trimestral | ~US$ 500/mês |

---

## 📞 7. Contatos de emergência

- **Suporte Lovable:** via chat no app + email
- **Suporte Supabase:** support@supabase.io (Pro plan tem SLA)
- **Status público Supabase:** https://status.supabase.com
- **Status público Lovable:** https://status.lovable.dev

---

**Última revisão:** 2026-06-09  
**Próxima revisão obrigatória:** 2026-09-09 (trimestral)
