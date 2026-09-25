import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.1.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

type Reason = 'bounce' | 'complaint' | 'unsubscribe'
const STATUS: Record<Reason, string> = { bounce: 'bounced', complaint: 'complained', unsubscribe: 'suppressed' }
const MESSAGE: Record<Reason, string> = {
  bounce: 'Permanent bounce — email address is invalid or rejected',
  complaint: 'Spam complaint — recipient marked email as spam',
  unsubscribe: 'Recipient unsubscribed',
}

async function record(reason: Reason, event: { event_id: string; data: { recipient: string; message_id?: string | null } }) {
  const email = String(event.data.recipient).toLowerCase()
  const { error: sErr } = await supabase
    .from('suppressed_emails')
    .upsert({ email, reason, metadata: null }, { onConflict: 'email' })
  if (sErr) {
    console.error('suppressed_emails upsert failed', { code: sErr.code, message: sErr.message, event_id: event.event_id })
    throw new Error('suppressed_emails upsert failed')
  }
  const { error: lErr } = await supabase.from('email_send_log').insert({
    message_id: event.data.message_id ?? null,
    template_name: 'system',
    recipient_email: email,
    status: STATUS[reason],
    error_message: MESSAGE[reason],
    metadata: null,
  })
  if (lErr) {
    console.error('email_send_log insert failed', { code: lErr.code, message: lErr.message, event_id: event.event_id })
    throw new Error('email_send_log insert failed')
  }
}

const handler = createEmailWebhookHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  on: {
    'email.bounced': (event) => record('bounce', event),
    'email.complaint': (event) => record('complaint', event),
    'email.unsubscribed': (event) => record('unsubscribe', event),
  },
})

Deno.serve((req) => handler(req))
