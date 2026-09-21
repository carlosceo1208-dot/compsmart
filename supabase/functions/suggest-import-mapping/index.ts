import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

interface FieldDef {
  key: string;
  label: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    // Exige usuário autenticado (nenhum dado pessoal trafega aqui, apenas cabeçalhos)
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return json({ error: 'Não autenticado' }, 401);

    const body = await req.json().catch(() => null);
    const headers: unknown = body?.headers;
    const fields: unknown = body?.fields;
    if (!Array.isArray(headers) || !Array.isArray(fields) || headers.length === 0 || fields.length === 0) {
      return json({ error: 'Informe headers e fields' }, 400);
    }

    const safeHeaders = (headers as unknown[]).slice(0, 120).map((h) => String(h).slice(0, 120));
    const safeFields = (fields as FieldDef[]).slice(0, 60).map((f) => ({
      key: String(f.key).slice(0, 60),
      label: String(f.label).slice(0, 120),
    }));

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return json({ error: 'LOVABLE_API_KEY não configurada' }, 500);

    const prompt = [
      'Você mapeia colunas de planilhas de folha de pagamento brasileiras para campos de um sistema de RH.',
      'Colunas disponíveis na planilha (use exatamente estes textos):',
      JSON.stringify(safeHeaders),
      'Campos do sistema que ainda não têm coluna:',
      JSON.stringify(safeFields),
      'Responda em JSON no formato {"mapping": {"<campo>": "<coluna>" | null}}.',
      'Use null quando nenhuma coluna corresponder. Nunca use a mesma coluna para dois campos.',
    ].join('\n');

    const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': apiKey,
        'X-Lovable-AIG-SDK': 'fetch',
      },
      body: JSON.stringify({
        model: 'openai/gpt-6-astra',
        input: prompt,
        stream: true,
        reasoning: { effort: 'low', summary: 'auto' },
        include: ['reasoning.encrypted_content'],
        text: {
          format: {
            type: 'json_schema',
            name: 'column_mapping',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['mapping'],
              properties: {
                mapping: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['field', 'column'],
                    properties: {
                      field: { type: 'string' },
                      column: { type: ['string', 'null'] },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return json({ error: 'Falha na sugestão de mapeamento', detail }, res.status);
    }
    if (!res.body) return json({ error: 'Resposta sem corpo' }, 502);

    // Acumula o texto final do stream SSE
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const chunk = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const event = JSON.parse(payload);
            if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') {
              text += event.delta;
            } else if (event.type === 'response.completed' && typeof event.response?.output_text === 'string') {
              text = event.response.output_text || text;
            }
          } catch {
            /* evento não-JSON: ignora */
          }
        }
      }
    }

    let mapping: Record<string, string | null> = {};
    try {
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed?.mapping) ? parsed.mapping : [];
      const usedColumns = new Set<string>();
      for (const item of list) {
        const field = String(item?.field ?? '');
        const column = item?.column == null ? null : String(item.column);
        if (!safeFields.some((f) => f.key === field)) continue;
        if (!column || !safeHeaders.includes(column) || usedColumns.has(column)) continue;
        mapping[field] = column;
        usedColumns.add(column);
      }
    } catch {
      mapping = {};
    }

    return json({ mapping });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Erro inesperado' }, 500);
  }
});
