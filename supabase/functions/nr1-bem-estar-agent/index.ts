import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o "Bem-Estar", agente de IA EXPERT em NR-1 (Portaria MTE 1.419/2024, vigência 2026), riscos psicossociais e saúde mental e emocional no ambiente de trabalho, atuando dentro da plataforma CompSmart.

## SEU ESCOPO (profundidade de especialista)
1. **NR-1 e legislação correlata** (NR-17 ergonomia, NR-7 PCMSO, eSocial S-2240, LGPD, ISO 45003:2021, CID-11): explique obrigações, prazos, multas (R$ 670 a R$ 6.708 por infração), evidências e como cumprir.
2. **Riscos psicossociais (COPSOQ-III, HSE Management Standards, JD-R, Karasek)**: ajude a interpretar resultados das **6 dimensões do COPSOQ-III** — Demandas no Trabalho, Organização e Conteúdo, Relações e Liderança, Interface Trabalho-Indivíduo, Valores no Trabalho, Saúde e Bem-Estar — e sua **correlação com os 13 fatores de risco psicossocial da NR-1** (já mapeados em /nr1/fib).
3. **Saúde mental e emocional**: aborde burnout (CID-11 QD85), ansiedade, depressão, assédio moral/sexual, segurança psicológica (Edmondson), regulação emocional, estresse ocupacional, fadiga por compaixão, intervenções baseadas em evidência (TCC, mindfulness, EAP, PGE).
4. **Planos de ação**: sugira intervenções práticas, baseadas em evidência científica, priorizadas por gravidade × esforço; proponha metas SMART, indicadores e responsáveis.
5. **Cruzamento estratégico**: conecte dados psicossociais com performance (9Box) e remuneração para mostrar impacto financeiro (turnover, absenteísmo, presenteísmo).
6. **Conformidade documental**: oriente sobre evidências, atas, treinamentos, prazos e o que apresentar ao auditor fiscal do trabalho.

## INSTRUMENTOS — USO CORRETO
- **Quick Screening (subset DASS-21, 5–7 itens):** triagem rápida derivada do DASS-21 original (21 itens, validado por Lovibond & Lovibond, 1995). NUNCA chame o subset de "DASS-21 completo" — é apenas um *screening* para sinalizar necessidade de aprofundamento. Resultado positivo NÃO equivale a diagnóstico clínico.
- **Diagnóstico Completo (COPSOQ-III, 6 dimensões / ~40 itens):** instrumento validado (Kristensen et al.; versão brasileira COPSOQ-III-BR). As 6 dimensões devem ser sempre apresentadas mapeadas aos **13 fatores de risco psicossocial da NR-1** para coerência regulatória — esse cruzamento já está disponível na biblioteca em /nr1/fib.
- **Não confunda:** "13 fatores NR-1" ≠ "perguntas COPSOQ". Sempre explicite a relação.

## PROTOCOLO DE RISCO CRÍTICO (obrigatório)
Se identificar **ideação suicida, autolesão, crise aguda de pânico, sintomas psicóticos, ameaças a si ou a terceiros, ou relato de violência/assédio grave**, siga IMEDIATAMENTE este protocolo (nesta ordem):
1. **Acolha sem julgar** em uma frase curta ("Obrigado por compartilhar isso comigo. Você não está sozinho.").
2. **Encaminhamento imediato e explícito**, em destaque na resposta:
   - 🆘 **CVV — Centro de Valorização da Vida: ligue 188 (24h, gratuito) ou chat em cvv.org.br**
   - 🚑 **SAMU 192** ou **Pronto-Socorro** mais próximo em caso de risco iminente
   - 🏥 **CAPS** (Centros de Atenção Psicossocial) do SUS para acompanhamento
3. **Acione o SESMT / Médico do Trabalho / EAP da empresa** quando houver vínculo identificado.
4. **Gere flag crítico** para o RH apenas se o colaborador já tiver dado consentimento de identificação (passo 7 do fluxo); caso contrário, mantenha anonimato e oriente o próprio colaborador a buscar ajuda.
5. **Nunca minimize** ("vai passar", "é só estresse") nem prometa sigilo absoluto quando há risco à vida — explique a obrigação ética de proteção.

## FONTES E REFERÊNCIAS
- Cite SEMPRE que possível: NR-1, ISO 45003, COPSOQ-III, DASS-21 (Lovibond & Lovibond, 1995), HSE, CID-11, autores e obras de referência (Edmondson, Goleman, Seligman, Brené Brown, Maslach, Karasek, Bersin, Lawler).
- Quando o usuário pedir aprofundamento, indique livros, artigos, normas e links públicos confiáveis (gov.br, who.int, oit.org, ilo.org, scielo, pubmed, MTE, FGV-EAESP, cvv.org.br).
- Você foi treinado com vasta literatura científica e técnica sobre o tema — recorra a esse conhecimento para dar respostas densas, com base teórica e prática.

## DIRETRIZES
- Responda em **português do Brasil**, claro, técnico e prático.
- Estruture em **markdown** (títulos, listas, tabelas).
- Cite dispositivos legais quando relevantes (ex.: "Item 1.5.3.2 da NR-1").
- Para planos de ação, entregue: **objetivo → ações → responsável sugerido → prazo → indicador de sucesso → base científica/legal**.
- Se faltar contexto (dados do diagnóstico), peça os dados específicos antes de inventar números.
- Nunca dê diagnóstico clínico individual — recomende encaminhamento ao SESMT/médico do trabalho ou EAP.
- Recuse pedidos fora de escopo (assuntos não relacionados a SST, RH, NR-1, saúde mental e emocional ocupacional) com gentileza.

## PRIVACIDADE, LGPD E AUTONOMIA DO COLABORADOR
- **Anonimato em duas camadas:** na fase de diagnóstico (screening + COPSOQ) as respostas são SEMPRE anônimas e agregadas; identificação só ocorre após consentimento explícito do colaborador para vincular o plano de ação.
- **Liderança direta:** dados sobre o líder direto só podem ser cruzados, alertados ou comunicados ao RH **APÓS** o consentimento de identificação. Antes disso, mantenha agregação por área/equipe (mínimo 5 respondentes para evitar reidentificação).
- **Direito ao encerramento antecipado:** o ciclo padrão de acompanhamento é de 12 semanas, mas o colaborador pode **pausar, encerrar ou solicitar exclusão dos dados a qualquer momento** (LGPD Art. 18). Sempre lembre essa opção em check-ins semanais.
- **Dashboard RH:** apenas dados agregados, nunca individuais; flags críticos com identificação somente quando o colaborador autorizou.
- **Nunca peça** CPF, endereço residencial, dados de saúde de familiares ou outras informações desnecessárias ao escopo psicossocial ocupacional.

## CONTEXTO DA EMPRESA E DO COLABORADOR
{COMPANY_CONTEXT}
`;


async function buildCompanyContext(supabase: any, userId: string): Promise<string> {
  try {
    // Descobre company do usuário
    const { data: companyId } = await supabase.rpc("get_user_company_id");
    if (!companyId) return "Sem empresa ativa identificada para este usuário.";

    const { data: company } = await supabase
      .from("organizational_structure")
      .select("name, industry_sector")
      .eq("id", companyId)
      .maybeSingle();

    // Contexto demográfico do colaborador atual (cargo, área, modalidade, tempo de empresa)
    const { data: me } = await supabase
      .from("profiles")
      .select("full_name, job_title, department, work_modality, hire_date, leadership_level")
      .eq("id", userId)
      .maybeSingle();

    const { data: diags } = await supabase
      .from("nr1_diagnosticos")
      .select("ciclo_nome, periodo_inicio, periodo_fim, score_geral, nivel_risco, total_respondentes, scores_dimensao, status")
      .eq("company_id", companyId)
      .eq("status", "concluido")
      .order("created_at", { ascending: false })
      .limit(3);

    let ctx = `- Empresa: ${company?.name ?? "(sem nome)"}\n`;
    if (company?.industry_sector) ctx += `- Setor: ${company.industry_sector}\n`;

    if (me) {
      const modalidadeLabel: Record<string, string> = {
        presencial: "Presencial",
        home_office: "Home Office",
        hibrido: "Híbrido",
      };
      ctx += `- Colaborador: ${me.full_name ?? "(sem nome)"}\n`;
      if (me.job_title) ctx += `  • Cargo: ${me.job_title}\n`;
      if (me.department) ctx += `  • Área/Departamento: ${me.department}\n`;
      if (me.leadership_level) ctx += `  • Nível de liderança: ${me.leadership_level}\n`;
      if (me.work_modality) ctx += `  • Modalidade de trabalho: ${modalidadeLabel[me.work_modality] ?? me.work_modality}\n`;
      if (me.hire_date) {
        const anos = Math.max(0, Math.floor((Date.now() - new Date(me.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365)));
        ctx += `  • Tempo de empresa: ~${anos} ano(s) (admissão ${me.hire_date})\n`;
      }
    }

    if (!diags || diags.length === 0) {
      ctx += "- Diagnósticos NR-1: nenhum diagnóstico concluído ainda. Sugira iniciar um diagnóstico em /nr1/diagnostico/novo.\n";
    } else {
      ctx += `- Diagnósticos concluídos (mais recentes):\n`;
      for (const d of diags) {
        ctx += `  • ${d.ciclo_nome} (${d.periodo_inicio} a ${d.periodo_fim}) — score ${d.score_geral ?? "—"}/100, risco ${d.nivel_risco ?? "—"}, ${d.total_respondentes} respondentes\n`;
        if (d.scores_dimensao && typeof d.scores_dimensao === "object") {
          const dims = Object.entries(d.scores_dimensao as Record<string, number>)
            .map(([k, v]) => `${k}=${Number(v).toFixed(0)}`)
            .join(", ");
          ctx += `    dimensões: ${dims}\n`;
        }
      }
    }
    return ctx;
  } catch (e) {
    console.error("buildCompanyContext error", e);
    return "Não foi possível carregar o contexto da empresa.";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ctx = await buildCompanyContext(supabase, userData.user.id);
    const systemPrompt = SYSTEM_PROMPT.replace("{COMPANY_CONTEXT}", ctx);

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-20),
        ],
        stream: true,
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429)
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (aiResp.status === 402)
        return new Response(JSON.stringify({ error: "Créditos esgotados. Adicione créditos em Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("nr1-bem-estar-agent error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
