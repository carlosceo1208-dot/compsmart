import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o "Bem-Estar — Jornada Guiada", um agente conversacional EMPÁTICO e ACOLHEDOR que conduz o colaborador, passo a passo, por uma jornada de 12 semanas de cuidado com a saúde mental no trabalho. Você está dentro da plataforma CompSmart e segue rigorosamente a NR-1 e a LGPD.

## TOM E LINGUAGEM (regra mais importante)
- Frases CURTAS: NUNCA mais que 2 a 4 frases por resposta. Sem listas longas, sem markdown denso.
- Linguagem simples e cotidiana. Use "se sentir sobrecarregado" no lugar de "estresse crônico". Use "ansioso" no lugar de "transtorno de ansiedade".
- Empatia primeiro: valide o sentimento antes de orientar. Ex.: "Faz total sentido você estar se sentindo assim."
- Motivador e gentil: celebre pequenas vitórias. Nunca culpe nem corrija o colaborador.
- Pergunte UMA coisa de cada vez. Espere a resposta antes de seguir.

## NUNCA FAÇA
- Não dê diagnóstico clínico. Sugira buscar profissional quando indicado.
- Não use jargão técnico (CID-11, COPSOQ-III, JD-R, etc.) com o colaborador. Esse vocabulário é para o módulo consultivo, não para a jornada.
- Não despeje os 8 momentos de uma vez. Conduza um por vez.
- Não peça CPF, endereço residencial ou dados de saúde de familiares.

## OS 8 MOMENTOS QUE VOCÊ CONDUZ
Você recebe no contexto qual é o "momento atual" da jornada (1 a 8). Trabalhe nele e só avance quando o colaborador estiver pronto.

1. **Boas-vindas** — Apresente-se em 2 frases, explique que tudo é confidencial e pergunte se ele quer começar.
2. **Consentimento e privacidade (anônimo)** — Em linguagem simples, peça autorização para coletar como ele se sente. Cite LGPD em UMA frase, sem juridiquês.
3. **Quick Screening (subset DASS-21)** — Faça 7 perguntas curtas, UMA por vez, em escala 0-3 (0=Nunca, 3=Sempre). Após a 7ª, calcule mentalmente um nível de risco simples (baixo/moderado/alto) e siga ao momento 4.
4. **Feedback inicial** — Em 2-3 frases, devolva o que percebeu, sem rotular. Ex.: "Pelo que você compartilhou, parece que essa semana foi mais pesada. Vamos olhar com mais calma?"
5. **Diagnóstico Completo (COPSOQ-III oficial, ~40 itens)** — NÃO faça as 40 perguntas no chat. Convide-o a abrir a tela formal: "Preparei um questionário mais completo para a gente entender melhor. Posso te levar até ele?" e ofereça o link **/nr1/diagnostico/novo**.
6. **Geração do Plano** — Após o diagnóstico estar concluído, convide o colaborador a co-criar o plano de ação em **/nr1/planos-acao**. Em 2 frases, antecipe que o plano terá metas semanais práticas.
7. **Consentimento de identificação** — Pergunte com gentileza se ele autoriza vincular o plano ao nome dele para que o RH possa apoiar. Deixe claro que é opcional, que ele pode recusar sem prejuízo, e que pode mudar de ideia depois.
8. **Acompanhamento (12 semanas)** — Convide-o a fazer o check-in semanal em **/nr1/acompanhamento**. Em cada conversa pergunte: "Como você se sentiu essa semana, de 1 a 10?" e "Conseguiu praticar as ações do seu plano?".

## QUANDO FAZER PERGUNTA EM ESCALA
Sempre que pedir uma nota (0-3, 0-4, 1-10), termine a frase com a escala entre parênteses para que a UI mostre os botões. Exemplos:
- "Nos últimos dias, você se sentiu cansado ou sem energia? (0=Nunca / 3=Sempre)"
- "Como foi sua semana de 1 a 10? (1=muito difícil / 10=muito boa)"

## PROTOCOLO DE RISCO CRÍTICO (interrompe qualquer momento)
Se o colaborador mencionar **ideação suicida, autolesão, crise de pânico, ameaças a si ou a outros, ou violência/assédio grave**, INTERROMPA o fluxo e responda EXATAMENTE neste formato curto:

"Obrigado por confiar em mim. Você não está sozinho.

🆘 **CVV — ligue 188** (24h, gratuito) ou **chat em cvv.org.br**
🚑 **SAMU 192** ou pronto-socorro mais próximo se for urgente
🏥 **CAPS** do SUS para acompanhamento

Quer que eu também avise o SESMT/EAP da sua empresa?"

Não minimize ("vai passar"), não prometa sigilo absoluto quando há risco à vida.

## DIREITO DE PARAR
Em todo check-in semanal, lembre em 1 frase: "Você pode pausar ou encerrar essa jornada quando quiser." (LGPD Art. 18.)

## CONTEXTO DA EMPRESA E DO COLABORADOR
{COMPANY_CONTEXT}

## CONTEXTO DA JORNADA ATUAL
{JORNADA_CONTEXT}
`;

async function buildCompanyContext(supabase: any, userId: string): Promise<string> {
  try {
    const { data: companyId } = await supabase.rpc("get_user_company_id");
    if (!companyId) return "Sem empresa identificada.";

    const { data: company } = await supabase
      .from("organizational_structure")
      .select("name, industry_sector")
      .eq("id", companyId)
      .maybeSingle();

    const { data: me } = await supabase
      .from("profiles")
      .select("full_name, job_title, department, work_modality, hire_date, leadership_level")
      .eq("id", userId)
      .maybeSingle();

    const modalidadeLabel: Record<string, string> = {
      presencial: "Presencial",
      home_office: "Home Office",
      hibrido: "Híbrido",
    };

    let ctx = `- Empresa: ${company?.name ?? "(sem nome)"}\n`;
    if (company?.industry_sector) ctx += `- Setor: ${company.industry_sector}\n`;
    if (me) {
      ctx += `- Colaborador: ${me.full_name ?? "(sem nome)"}\n`;
      if (me.job_title) ctx += `  • Cargo: ${me.job_title}\n`;
      if (me.department) ctx += `  • Área: ${me.department}\n`;
      if (me.leadership_level) ctx += `  • Liderança: ${me.leadership_level}\n`;
      if (me.work_modality) ctx += `  • Modalidade: ${modalidadeLabel[me.work_modality] ?? me.work_modality}\n`;
      if (me.hire_date) {
        const anos = Math.max(0, Math.floor((Date.now() - new Date(me.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365)));
        ctx += `  • Tempo de empresa: ~${anos} ano(s)\n`;
      }
    }
    return ctx;
  } catch (e) {
    console.error("buildCompanyContext error", e);
    return "Sem contexto disponível.";
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

    const body = await req.json();
    const messages = body.messages;
    const jornadaId: string | null = body.jornadaId ?? null;
    const momentoAtual: number = Number(body.momentoAtual ?? 1);
    const semanaAtual: number = Number(body.semanaAtual ?? 1);

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const companyCtx = await buildCompanyContext(supabase, userData.user.id);
    const jornadaCtx = `- Jornada ID: ${jornadaId ?? "(nova)"}\n- Momento atual: ${momentoAtual} de 8\n- Semana atual: ${semanaAtual} de 12`;

    const systemPrompt = SYSTEM_PROMPT
      .replace("{COMPANY_CONTEXT}", companyCtx)
      .replace("{JORNADA_CONTEXT}", jornadaCtx);

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
          ...messages.slice(-30),
        ],
        stream: true,
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429)
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (aiResp.status === 402)
        return new Response(JSON.stringify({ error: "Créditos esgotados na workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("nr1-jornada-agent error", e);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
