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
      return json(convite);
    }

    if (action === 'submit') {
      const submissionId = typeof body?.submissionId === 'string' ? body.submissionId : '';
      const respostas = body?.respostas;
      if (!uuidPattern.test(submissionId) || !respostas || typeof respostas !== 'object' || Array.isArray(respostas)) return json({ error: 'Envio inválido' }, 400);
      if (Object.keys(respostas).length > 100) return json({ error: 'Quantidade de respostas inválida' }, 400);
      const { error } = await db.rpc('nr1_submeter_respostas', { p_token: token, p_submission_id: submissionId, p_respostas: respostas });
      if (error) return json({ error: error.message.includes('já foi enviado') ? 'Este questionário já foi enviado.' : 'Não foi possível registrar as respostas.' }, 400);
      return json({ success: true });
    }
    return json({ error: 'Ação inválida' }, 400);
  } catch (error) {
    console.error('nr1-questionario-publico', error);
    return json({ error: 'Erro ao processar o questionário' }, 500);
  }
});