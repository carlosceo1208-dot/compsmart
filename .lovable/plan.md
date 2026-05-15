## Objetivo

Adicionar à **Biblioteca NR-1** (`/nr1/biblioteca`) uma nova seção dedicada a **Privacidade, Anonimato & Consentimento (LGPD)** que materialize, em forma navegável, todas as regras que hoje vivem apenas no prompt do agente Bem-Estar e nos testes de regressão.

## Por que faz sentido

- Auditor fiscal / DPO pode abrir a biblioteca e ver, escrito, como o módulo trata dados sensíveis.
- Colaborador entende o que acontece com a resposta dele antes de aceitar o consentimento.
- RH tem um manual único do que pode e não pode cruzar com liderança direta.
- A biblioteca já é o ponto canônico de "fonte da verdade metodológica" — é coerente.

## Estrutura proposta

### 1. Nova aba na biblioteca

`Tabs` ganha um 5º trigger: **"Privacidade & LGPD"** (ícone `ShieldCheck`).

### 2. Conteúdo (4 blocos em accordion)

**Bloco A — Anonimato por Padrão**
- Tabela `nr1_diagnostico_respostas` guarda apenas `respondent_hash` (sem user_id, e-mail, CPF).
- Nem super-admin consegue reabrir resposta individual.
- Diagnóstico (screening DASS-21 subset + COPSOQ-III) é SEMPRE anônimo e agregado.
- Regra de k-anonimato: mínimo de **5 respondentes** por recorte (área, equipe, gestor) antes de exibir agregado.

**Bloco B — Consentimento Explícito (LGPD Art. 7º, 8º, 9º)**
- 3 aceites obrigatórios no primeiro acesso (uso, anonimato, revogação).
- Versionamento do termo (`NR1_CONSENT_VERSION`) — mudança de versão dispara reaceite.
- Reconfirmação leve a cada novo ciclo de questionário.
- Persistência em `profiles.nr1_consent_at` + `nr1_consent_version`.

**Bloco C — Cruzamento com Liderança Direta & RH**
- Antes do consentimento de identificação (passo 7): só agregação por área/equipe.
- Depois do consentimento: pode vincular plano de ação ao colaborador, gerar flag crítico para RH/SESMT.
- Dashboard RH **nunca** recebe linhas individuais; flags identificadas só com autorização.
- Vedações: nunca pedir CPF, endereço residencial, dados de saúde de familiares.

**Bloco D — Direitos do Titular & Protocolo de Crise**
- LGPD Art. 18: direito de pausar, encerrar ciclo de 12 semanas, solicitar exclusão a qualquer momento.
- Protocolo de risco crítico (ideação suicida, autolesão, pânico agudo): CVV 188, SAMU 192, CAPS, SESMT/EAP.
- Recusa de consentimento não impacta vínculo nem avaliação.

### 3. Inclusão também em Metodologias e Siglas

- **Metodologias**: nova entrada `LGPD-NR1` com base legal (Lei 13.709/2018 Art. 7º, 9º, 18; NR-1 1.5.3.2; ISO 45003 §5.4) e como aplicamos.
- **Siglas**: `LGPD`, `DPO`, `EAP`, `CVV`, `CAPS`, `SESMT`, `PCMSO` — adicionar as que ainda faltarem.
- **Fatores de Risco**: já existem os 13 — apenas reforçar no novo bloco a relação com COPSOQ-III.

## Arquivos afetados

- `src/pages/nr1/Nr1Biblioteca.tsx` — nova `TabsTrigger` + `TabsContent`, dataset `PRIVACIDADE_BLOCOS`, complementos a `METODOLOGIAS` e `SIGLAS`.
- Nenhuma migração de banco; nenhuma mudança no agente; nenhum novo teste necessário (a regra continua testada em `nr1-anonimato-consentimento.test.ts`, agora com a biblioteca como reflexo visual da mesma fonte).

## Não-objetivos

- Não duplicar o termo de consentimento que já vive em `/nr1/consentimento` — a biblioteca **referencia** essa página com link.
- Não criar página nova de rota — fica tudo dentro da biblioteca para manter "tudo num lugar só".
- Não mexer no design system NR-1 (`.nr1-scope` continua igual).

## Resultado esperado

Ao abrir `/nr1/biblioteca` → aba "Privacidade & LGPD", o usuário vê 4 accordions com regras citáveis, base legal e links para CVV/SAMU/CAPS, alinhados 1:1 com o que o agente Bem-Estar pratica em runtime.