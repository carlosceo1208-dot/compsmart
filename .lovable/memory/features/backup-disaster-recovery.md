---
name: Backup & DR Strategy
description: RPO 24h, RTO 4h. Snapshot diário nativo Supabase (7d retenção). PITR ativar quando MRR > R$5k. Backup externo S3 semanal a partir de 10 clientes. Runbook completo em docs/BACKUP_DISASTER_RECOVERY.md
type: feature
---

## Metas oficiais
- **RPO:** ≤ 24h (perda máxima aceitável de dados)
- **RTO:** ≤ 4h (tempo máximo para retomar operação)

## Camadas de proteção
1. **Snapshot diário Supabase** (ativo agora, 7d retenção) — defesa contra falha técnica
2. **PITR** — ativar quando MRR > R$ 5k, custo ~US$ 100/mês
3. **Backup externo S3 semanal** — ativar a partir de 10 clientes pagos, defesa contra falha do provedor
4. **Código no GitHub** (já sincronizado) — defesa contra problema comercial com Lovable

## Cenários documentados
A) Tabela apagada → restore para banco temp + INSERT SELECT
B) Banco corrompido → aguardar SLA Supabase + comunicação
C) Cliente apagou próprios dados → extração tenant-scoped do snapshot, cobrar serviço se negligência
D) Conta Lovable suspensa → self-hosting via GitHub + backup externo

## Checklist mensal (5min)
Backups visíveis, cartão Lovable válido, domínio pago, GitHub sincronizando, incidentes do mês.

Runbook completo: `docs/BACKUP_DISASTER_RECOVERY.md`
