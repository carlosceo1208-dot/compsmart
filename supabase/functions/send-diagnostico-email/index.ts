import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const TEMPLATE = 'diagnostico-resultado'
const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: any
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }
  const leadId = typeof body?.leadId === 'string' ? body.leadId : ''
  if (!/^[0-9a-f-]{36}$/i.test(leadId)) return json({ error: 'leadId inválido' }, 400)

  const rawDims = Array.isArray(body?.dimensoes) ? body.dimensoes.slice(0, 10) : []
  const dimensoes = rawDims
    .filter((d: any) => typeof d?.label === 'string' && typeof d?.score === 'number')
    .map((d: any) => ({ label: d.label.slice(0, 80), score: Math.max(0, Math.min(100, d.score)) }))
  const nivel = typeof body?.nivel === 'string' ? body.nivel.slice(0, 30) : undefined

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: lead, error } = await supabase
    .from('leads')
    .select('id, nome, email, origem, score_free, updated_at')
    .eq('id', leadId)
    .maybeSingle()
  if (error || !lead || lead.origem !== 'diagnostico' || !lead.email) return json({ error: 'Lead não encontrado' }, 404)
  // Only send right after a submission (limits abuse of this public endpoint)
  if (Date.now() - new Date(lead.updated_at).getTime() > 10 * 60 * 1000) return json({ error: 'Expirado' }, 410)

  const recipient = String(lead.email).toLowerCase()
  const log = async (status: string, error_message?: string) => {
    const { error: e } = await supabase.from('email_send_log').insert({
      message_id: null, template_name: TEMPLATE, recipient_email: recipient, status, error_message: error_message ?? null,
    })
    if (e) console.error('email_send_log insert failed', { code: e.code, message: e.message })
  }

  try {
    const result = await sendTemplateEmail(TEMPLATE, recipient, {
      templateData: {
        nome: String(lead.nome ?? '').split(' ')[0],
        score: Number(lead.score_free ?? 0),
        nivel,
        dimensoes,
      },
      idempotencyKey: `${TEMPLATE}-${lead.id}-${new Date(lead.updated_at).getTime()}`,
    })
    if (result.sent) { await log('sent'); return json({ success: true }) }
    await log('suppressed')
    return json({ success: false, reason: 'recipient_suppressed' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await log('failed', msg.slice(0, 500))
    console.error('send failed', { message: msg })
    return json({ error: 'Falha ao enviar' }, 500)
  }
})
