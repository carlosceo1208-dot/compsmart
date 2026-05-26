import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FALLBACK_APP_BASE_URL = 'https://compsmart.ia.br';
const ALLOWED_APP_HOSTS = new Set([
  'compsmart.ia.br',
  'www.compsmart.ia.br',
  'smartcomp.ia.br',
  'www.smartcomp.ia.br',
  'compsmart.lovable.app',
]);

function resolveAppBaseUrl(req: Request) {
  for (const candidate of [req.headers.get('origin'), req.headers.get('referer')]) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate);
      if (ALLOWED_APP_HOSTS.has(url.host)) return `${url.protocol}//${url.host}`;
    } catch { /* noop */ }
  }
  return FALLBACK_APP_BASE_URL;
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

interface ReqBody {
  pesquisa_id: string;
  employee_ids?: string[]; // se vazio = todos colaboradores ativos
  is_reminder?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) throw new Error('RESEND_API_KEY não configurado');

    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Não autorizado');
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error('Token inválido');

    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
    const userRoles = roles?.map(r => r.role) ?? [];
    if (!userRoles.includes('admin') && !userRoles.includes('hr_manager')) {
      throw new Error('Sem permissão');
    }

    const { data: profile } = await supabase.from('profiles').select('root_company_id, full_name').eq('id', user.id).single();
    if (!profile?.root_company_id) throw new Error('Empresa não encontrada');
    const companyId = profile.root_company_id;

    const body: ReqBody = await req.json();
    if (!body.pesquisa_id) throw new Error('pesquisa_id obrigatório');

    // Busca pesquisa
    const { data: pesquisa, error: pErr } = await supabase
      .from('clima_pesquisas')
      .select('id, nome, status, public_token, company_id')
      .eq('id', body.pesquisa_id)
      .eq('company_id', companyId)
      .maybeSingle();
    if (pErr || !pesquisa) throw new Error('Pesquisa não encontrada');
    if (pesquisa.status !== 'aberta') throw new Error('Pesquisa não está aberta');

    // Empresa (nome)
    const { data: company } = await supabase
      .from('organizational_structure')
      .select('name')
      .eq('id', companyId)
      .single();
    const companyName = company?.name ?? 'sua empresa';

    // Colaboradores destinatários
    let query = supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('root_company_id', companyId)
      .eq('status', 'active')
      .not('employee_number', 'is', null)
      .not('email', 'is', null);

    if (body.employee_ids?.length) {
      query = query.in('id', body.employee_ids);
    }
    const { data: employees, error: eErr } = await query;
    if (eErr) throw eErr;
    if (!employees?.length) throw new Error('Nenhum colaborador elegível encontrado');

    const appBaseUrl = resolveAppBaseUrl(req);
    const publicLink = `${appBaseUrl}/clima/publico/${pesquisa.public_token}`;
    const resend = new Resend(resendKey);

    const subject = body.is_reminder
      ? `Lembrete: sua opinião na Pesquisa de Clima 360° (${esc(companyName)})`
      : `Convite: Pesquisa de Clima 360° — ${esc(companyName)}`;

    const sent: string[] = [];
    const errors: { name: string; error: string }[] = [];

    for (const emp of employees) {
      if (!emp.email) continue;
      try {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1E2761;">
            <div style="background: linear-gradient(135deg, #1E2761 0%, #22C55E 100%); padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 22px;">Pesquisa de Clima 360°</h1>
              <p style="color: white; margin: 8px 0 0; font-size: 14px; opacity: 0.9;">${esc(companyName)}</p>
            </div>
            <div style="background: #ffffff; padding: 28px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px;">Olá <strong>${esc(emp.full_name)}</strong>,</p>
              <p>${body.is_reminder
                ? 'Você recebeu o convite recentemente e ainda há tempo para participar. Sua opinião é fundamental para tornar o ambiente de trabalho melhor.'
                : 'Sua opinião é fundamental para construirmos um ambiente de trabalho melhor. Convidamos você a participar da nossa <strong>Pesquisa de Clima Organizacional 360°</strong>.'}</p>
              <div style="background: #F5F0EB; padding: 16px; border-left: 4px solid #E8634A; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;"><strong>🔒 100% anônima.</strong> Suas respostas são armazenadas via hash criptográfico — ninguém saberá quem respondeu o quê.</p>
              </div>
              <ul style="font-size: 14px; color: #475569;">
                <li>60 questões em 10 dimensões (liderança, segurança psicológica, propósito, etc.)</li>
                <li>Leva cerca de <strong>15 minutos</strong></li>
                <li>Conforme LGPD e NR-1 — riscos psicossociais</li>
              </ul>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${publicLink}"
                   style="background: #E8634A; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                  Responder agora
                </a>
              </div>
              <p style="font-size: 12px; color: #64748b; text-align: center;">
                Ou copie este link: <br/>
                <span style="word-break: break-all; color: #1E2761;">${publicLink}</span>
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;"/>
              <p style="font-size: 11px; color: #94a3b8; text-align: center;">
                Esta pesquisa faz parte do programa de gestão de riscos psicossociais (NR-1).<br/>
                ${esc(companyName)} · CompSmart
              </p>
            </div>
          </div>
        `;

        const fromAddress = Deno.env.get('CLIMA_FROM_EMAIL') ?? 'CompSmart <onboarding@resend.dev>';
        const { error: sendErr } = await resend.emails.send({
          from: fromAddress,
          to: [emp.email],
          subject,
          html,
        });
        if (sendErr) {
          errors.push({ name: emp.full_name, error: 'Falha ao enviar convite' });
        } else {
          sent.push(emp.full_name);
        }
      } catch (e: any) {
        errors.push({ name: emp.full_name, error: 'Erro ao processar' });
      }
    }

    // Atualiza contador
    await supabase.rpc('registrar_envio_convites_clima' as any, {
      _pesquisa_id: pesquisa.id,
      _quantidade: sent.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        sent_count: sent.length,
        error_count: errors.length,
        errors,
        public_link: publicLink,
        is_reminder: !!body.is_reminder,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('send-clima-invitations error:', e);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
