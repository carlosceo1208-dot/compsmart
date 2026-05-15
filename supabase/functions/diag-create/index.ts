import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const email = `diag${Date.now()}@example.com`;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: 'TestPass!2026Diag',
    email_confirm: true,
  });
  return new Response(JSON.stringify({
    email,
    error: error ? { message: error.message, status: (error as any).status, name: error.name, code: (error as any).code } : null,
    user_id: data?.user?.id ?? null,
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
});
