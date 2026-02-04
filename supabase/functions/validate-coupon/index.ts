import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { coupon_code, plan_id, billing_cycle, amount } = await req.json();

    if (!coupon_code) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Código do cupom não fornecido' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use secure RPC function instead of direct table query
    const { data: validation, error: validationError } = await supabaseClient.rpc(
      'validate_coupon_code',
      {
        p_code: coupon_code.toUpperCase(),
        p_plan_id: plan_id || null,
        p_billing_cycle: billing_cycle || null
      }
    );

    if (validationError) {
      console.error('Coupon validation error:', validationError);
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Erro ao validar cupom' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // RPC returns array, get first result
    const result = Array.isArray(validation) ? validation[0] : validation;

    if (!result?.is_valid) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: result?.error_message || 'Cupom inválido' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate discount if amount provided
    let discount_value = 0;
    if (amount) {
      if (result.discount_type === 'percentage') {
        discount_value = amount * (result.discount_value / 100);
      } else {
        discount_value = Math.min(result.discount_value, amount);
      }
    }

    const final_amount = amount ? Math.max(amount - discount_value, 0) : null;

    return new Response(JSON.stringify({
      valid: true,
      coupon: {
        code: coupon_code.toUpperCase(),
        discount_type: result.discount_type,
        discount_value: result.discount_value,
        description: result.discount_type === 'percentage' 
          ? `${result.discount_value}% de desconto`
          : `R$ ${result.discount_value.toFixed(2)} de desconto`
      },
      calculated_discount: discount_value,
      final_amount: final_amount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error validating coupon:', error);
    return new Response(JSON.stringify({ 
      valid: false, 
      error: 'Erro ao validar cupom' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
