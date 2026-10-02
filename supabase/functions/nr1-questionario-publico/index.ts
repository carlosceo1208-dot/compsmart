import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const tokenPattern = /^[0-9a-f]{48}$/i;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);
  try {
    const body = await req.json();
    const action = body?.action;
    const token = typeof body?.token === 'string' ? body.token : '';
    if (!tokenPattern.test(token)) return json({ error: 'Link inválido' }, 400);
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

    if (action === 'resolve') {
      const { data, error } = await db.rpc('nr1_convite_resolver', { p_token: token });
      if (error) throw error;
      const convite = data?.[0];
      if (!convite?.disponivel) return json({ error: 'Este link expirou ou não está mais disponível.' }, 410);
      const { data: segpsi, error: segErr } = await db.from('nr1_segpsi_questoes').select('id, codigo, dimensao, enunciado, ordem, reverso').eq('ativo', true).order('ordem');
      if (segErr) throw segErr;
      // Catálogo do Vitalidade lido aqui, pelo servidor (acesso próprio), só os itens próprios.
      // Itens de referência ao COPSOQ já aparecem no bloco do diagnóstico e não se repetem.
      const { data: vit, error: vitErr } = await db.from('nr1_vitalidade_questoes').select('id, codigo, dimensao, origem, copsoq_questao_id, enunciado, ordem, reverso').eq('ativo', true).order('ordem');
      if (vitErr) throw vitErr;
      // Lista controlada de áreas da empresa do ciclo (só nomes; vazia não trava o envio).
      let areas: string[] = [];
      const { data: conv } = await db.from('nr1_convites').select('diagnostico_id').eq('token', token).maybeSingle();
      if (conv?.diagnostico_id) {
        const { data: diag } = await db.from('nr1_diagnosticos').select('company_id').eq('id', conv.diagnostico_id).maybeSingle();
        if (diag?.company_id) {
          const { data: nomes } = await db.rpc('nr1_areas_empresa', { _company: diag.company_id });
          areas = ((nomes ?? []) as unknown[]).map((n) => (typeof n === 'string' ? n : (n as Record<string, string>)?.nr1_areas_empresa)).filter(Boolean) as string[];
        }
      }
      return json({ ...convite, questoes_segpsi: segpsi ?? [], questoes_vitalidade: vit ?? [], areas });
    }

    if (action === 'submit') {
      const submissionId = typeof body?.submissionId === 'string' ? body.submissionId : '';
      const respostas = body?.respostas;
      const respostasSegPsi = body?.respostasSegPsi;
      const respostasVitalidade = body?.respostasVitalidade;
      const isObj = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v);
      if (!uuidPattern.test(submissionId) || !isObj(respostas) || !isObj(respostasSegPsi) || !isObj(respostasVitalidade)) return json({ error: 'Envio inválido' }, 400);
      if (Object.keys(respostas).length > 100 || Object.keys(respostasSegPsi).length > 50 || Object.keys(respostasVitalidade).length > 30) return json({ error: 'Quantidade de respostas inválida' }, 400);
      const demografia = isObj(body?.demografia) ? body.demografia : null;
      const { error } = await db.rpc('nr1_submeter_completo', { p_token: token, p_submission_id: submissionId, p_respostas: respostas, p_respostas_segpsi: respostasSegPsi, p_respostas_vitalidade: respostasVitalidade, p_demografia: demografia });
      if (error) return json({ error: error.message.includes('já foi enviado') ? 'Este questionário já foi enviado.' : 'Não foi possível registrar as respostas.' }, 400);
      return json({ success: true });
    }
    return json({ error: 'Ação inválida' }, 400);
  } catch (error) {
    console.error('nr1-questionario-publico', error);
    return json({ error: 'Erro ao processar o questionário' }, 500);
  }
});