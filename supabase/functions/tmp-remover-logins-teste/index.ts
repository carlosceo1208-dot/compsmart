import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const ALVOS: Record<string, string> = {
  '64e6942c-e808-4fc1-9da0-efcc6e883746': 'teste.nr1.hr_manager@compsmart.ia.br',
  'd268b029-45b8-4900-88a1-d8c145e4ccf7': 'teste.nr1.admin@compsmart.ia.br',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const { data: u } = await admin.auth.getUser(token)
  if (!u?.user) return json({ error: 'sem login' }, 401)
  const { data: r } = await admin.from('user_roles').select('role').eq('user_id', u.user.id).eq('role', 'super_admin')
  if (!r?.length) return json({ error: 'Acesso negado' }, 403)
  const out: unknown[] = []
  for (const [id, email] of Object.entries(ALVOS)) {
    const { data: g } = await admin.auth.admin.getUserById(id)
    if (!g?.user || g.user.email !== email) { out.push({ email, status: 'nao encontrado' }); continue }
    await admin.from('user_roles').delete().eq('user_id', id)
    await admin.from('profiles').delete().eq('id', id)
    const { error } = await admin.auth.admin.deleteUser(id)
    if (error) {
      const { error: e2 } = await admin.auth.admin.updateUserById(id, { ban_duration: '638000h' })
      out.push({ email, status: e2 ? 'falhou: ' + e2.message : 'banido', erroDelete: error.message })
    } else out.push({ email, status: 'removido' })
  }
  return json({ out })
})
