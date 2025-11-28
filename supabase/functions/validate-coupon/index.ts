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

    // Buscar cupom
    const { data: coupon, error: couponError } = await supabaseClient
      .from('discount_coupons')
      .select('*')
      .eq('code', coupon_code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (couponError || !coupon) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Cupom não encontrado ou inválido' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validar período
    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Cupom ainda não está ativo' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Cupom expirado' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validar limite de uso
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Cupom esgotado' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validar planos aplicáveis
    if (coupon.applicable_plans && coupon.applicable_plans.length > 0) {
      if (!coupon.applicable_plans.includes(plan_id)) {
        return new Response(JSON.stringify({ 
          valid: false, 
          error: 'Cupom não aplicável a este plano' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Validar ciclo de cobrança mínimo
    if (coupon.min_billing_cycle === 'annual' && billing_cycle === 'monthly') {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Cupom válido apenas para planos anuais' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calcular desconto
    let discount_value = 0;
    if (amount) {
      if (coupon.discount_type === 'percentage') {
        discount_value = amount * (coupon.discount_value / 100);
      } else {
        discount_value = Math.min(coupon.discount_value, amount);
      }
    }

    const final_amount = amount ? Math.max(amount - discount_value, 0) : null;

    return new Response(JSON.stringify({
      valid: true,
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        description: coupon.discount_type === 'percentage' 
          ? `${coupon.discount_value}% de desconto`
          : `R$ ${coupon.discount_value.toFixed(2)} de desconto`
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
