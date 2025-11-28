import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAGARME_API_URL = 'https://api.pagar.me/core/v5';

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

    const { plan_id, billing_cycle, payment_method, coupon_code, card_token, document_type, document_value } = await req.json();

    if (!plan_id || !billing_cycle || !payment_method) {
      return new Response(JSON.stringify({ error: 'Parâmetros obrigatórios não fornecidos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar plano
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: 'Plano não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*, organizational_structure:root_company_id(*)')
      .eq('id', user.id)
      .single();

    // Determinar documento a usar
    let customerDocument: string;
    let customerType: 'individual' | 'company';

    if (document_type && document_value) {
      // Usar documento fornecido pelo frontend
      customerDocument = document_value.replace(/\D/g, '');
      customerType = document_type === 'cnpj' ? 'company' : 'individual';
    } else if (document_type === 'cnpj' && profile?.organizational_structure?.cnpj) {
      // Fallback para CNPJ da empresa
      customerDocument = profile.organizational_structure.cnpj.replace(/\D/g, '');
      customerType = 'company';
    } else if (profile?.cpf) {
      // Fallback para CPF do perfil
      customerDocument = profile.cpf.replace(/\D/g, '');
      customerType = 'individual';
    } else {
      return new Response(JSON.stringify({ 
        error: 'CPF ou CNPJ é obrigatório para processar o pagamento' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validar documento
    if (customerType === 'company' && customerDocument.length !== 14) {
      return new Response(JSON.stringify({ 
        error: 'CNPJ inválido - deve conter 14 dígitos' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (customerType === 'individual' && customerDocument.length !== 11) {
      return new Response(JSON.stringify({ 
        error: 'CPF inválido - deve conter 11 dígitos' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rejeitar documentos inválidos (todos zeros)
    if (customerDocument === '00000000000' || customerDocument === '00000000000000') {
      return new Response(JSON.stringify({ 
        error: `${customerType === 'company' ? 'CNPJ' : 'CPF'} inválido` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing payment for ${customerType} with document: ${customerDocument.substring(0, 3)}***`);

    // Calcular valor
    let amount_cents = billing_cycle === 'annual' 
      ? Math.round(plan.annual_price * 100) 
      : Math.round(plan.monthly_price * 100);

    let discount_cents = 0;

    // Validar cupom se fornecido
    if (coupon_code) {
      const { data: coupon } = await supabaseClient
        .from('discount_coupons')
        .select('*')
        .eq('code', coupon_code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (coupon) {
        const now = new Date();
        const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

        const isValidPeriod = (!validFrom || now >= validFrom) && (!validUntil || now <= validUntil);
        const isValidUses = !coupon.max_uses || coupon.used_count < coupon.max_uses;

        if (isValidPeriod && isValidUses) {
          if (coupon.discount_type === 'percentage') {
            discount_cents = Math.round(amount_cents * (coupon.discount_value / 100));
          } else {
            discount_cents = Math.round(coupon.discount_value * 100);
          }
        }
      }
    }

    // Desconto adicional para PIX (5%)
    if (payment_method === 'pix') {
      const pixDiscount = Math.round((amount_cents - discount_cents) * 0.05);
      discount_cents += pixDiscount;
    }

    const final_amount_cents = Math.max(amount_cents - discount_cents, 100);

    // Criar pedido no Pagar.me
    const PAGARME_API_KEY = Deno.env.get('PAGARME_API_KEY');
    
    const orderPayload: any = {
      customer: {
        name: profile?.full_name || user.email?.split('@')[0] || 'Cliente',
        email: user.email,
        type: customerType,
        document: customerDocument,
        phones: {
          mobile_phone: {
            country_code: '55',
            area_code: profile?.phone?.substring(0, 2) || '11',
            number: profile?.phone?.replace(/\D/g, '').substring(2) || '999999999'
          }
        }
      },
      items: [{
        amount: final_amount_cents,
        description: `${plan.name} - ${billing_cycle === 'annual' ? 'Anual' : 'Mensal'}`,
        quantity: 1,
        code: plan.id
      }],
      payments: []
    };

    // Configurar pagamento baseado no método
    if (payment_method === 'pix') {
      orderPayload.payments.push({
        payment_method: 'pix',
        pix: {
          expires_in: 1800 // 30 minutos
        }
      });
    } else if (payment_method === 'credit_card' && card_token) {
      orderPayload.payments.push({
        payment_method: 'credit_card',
        credit_card: {
          card_token: card_token,
          installments: 1,
          statement_descriptor: 'COMPSMART',
          card: {
            billing_address: {
              line_1: '123, Av Paulista',
              zip_code: '01310100',
              city: 'São Paulo',
              state: 'SP',
              country: 'BR'
            }
          }
        }
      });
    } else if (payment_method === 'boleto') {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      
      orderPayload.payments.push({
        payment_method: 'boleto',
        boleto: {
          instructions: 'Pagamento referente à assinatura CompSmart',
          due_at: dueDate.toISOString(),
          document_number: Date.now().toString().substring(0, 12)
        }
      });
    }

    console.log('Creating Pagar.me order:', JSON.stringify(orderPayload, null, 2));

    const pagarmeResponse = await fetch(`${PAGARME_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(PAGARME_API_KEY + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    const pagarmeOrder = await pagarmeResponse.json();

    console.log('Pagar.me response:', JSON.stringify(pagarmeOrder, null, 2));

    if (!pagarmeResponse.ok) {
      console.error('Pagar.me error:', pagarmeOrder);
      return new Response(JSON.stringify({ 
        error: 'Erro ao processar pagamento',
        details: pagarmeOrder.message || pagarmeOrder.errors 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extrair informações de pagamento
    const charge = pagarmeOrder.charges?.[0];
    const lastTransaction = charge?.last_transaction;

    let checkoutData: any = {
      user_id: user.id,
      company_id: profile?.root_company_id,
      plan_id: plan_id,
      billing_cycle: billing_cycle,
      payment_method: payment_method,
      amount_cents: amount_cents,
      discount_cents: discount_cents,
      coupon_code: coupon_code?.toUpperCase() || null,
      pagarme_order_id: pagarmeOrder.id,
      pagarme_charge_id: charge?.id,
      status: pagarmeOrder.status === 'paid' ? 'paid' : 'pending',
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };

    // Dados específicos por método
    if (payment_method === 'pix' && lastTransaction?.qr_code) {
      checkoutData.pix_qr_code = lastTransaction.qr_code;
      checkoutData.pix_qr_code_url = lastTransaction.qr_code_url;
      checkoutData.pix_expiration = lastTransaction.expires_at;
    } else if (payment_method === 'boleto' && lastTransaction) {
      checkoutData.boleto_url = lastTransaction.pdf;
      checkoutData.boleto_barcode = lastTransaction.line;
      checkoutData.boleto_due_date = lastTransaction.due_at;
    }

    if (pagarmeOrder.status === 'paid') {
      checkoutData.paid_at = new Date().toISOString();
    }

    // Salvar checkout session
    const { data: checkoutSession, error: insertError } = await supabaseClient
      .from('checkout_sessions')
      .insert(checkoutData)
      .select()
      .single();

    if (insertError) {
      console.error('Error saving checkout session:', insertError);
    }

    // Incrementar uso do cupom se usado
    if (coupon_code && discount_cents > 0) {
      await supabaseClient.rpc('increment_coupon_usage', { coupon_code: coupon_code.toUpperCase() });
    }

    // Se pagamento com cartão foi aprovado, ativar assinatura
    if (payment_method === 'credit_card' && pagarmeOrder.status === 'paid') {
      await activateSubscription(supabaseClient, user.id, profile?.root_company_id, plan, billing_cycle, final_amount_cents / 100);
    }

    return new Response(JSON.stringify({
      success: true,
      checkout_session_id: checkoutSession?.id,
      order_id: pagarmeOrder.id,
      status: pagarmeOrder.status,
      payment_method: payment_method,
      amount: final_amount_cents / 100,
      pix: payment_method === 'pix' ? {
        qr_code: lastTransaction?.qr_code,
        qr_code_url: lastTransaction?.qr_code_url,
        expires_at: lastTransaction?.expires_at
      } : null,
      boleto: payment_method === 'boleto' ? {
        url: lastTransaction?.pdf,
        barcode: lastTransaction?.line,
        due_at: lastTransaction?.due_at
      } : null,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-checkout-session:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function activateSubscription(
  supabase: any, 
  userId: string, 
  companyId: string | null, 
  plan: any, 
  billingCycle: string,
  amountPaid: number
) {
  if (!companyId) return;

  const now = new Date();
  const nextBilling = new Date(now);
  nextBilling.setMonth(nextBilling.getMonth() + (billingCycle === 'annual' ? 12 : 1));

  // Criar ou atualizar assinatura da empresa
  const { data: existingSub } = await supabase
    .from('company_subscriptions')
    .select('id')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .single();

  if (existingSub) {
    await supabase
      .from('company_subscriptions')
      .update({
        plan_id: plan.id,
        billing_cycle: billingCycle,
        monthly_price: plan.monthly_price,
        annual_price: plan.annual_price,
        last_payment_date: now.toISOString(),
        next_billing_date: nextBilling.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', existingSub.id);
  } else {
    await supabase
      .from('company_subscriptions')
      .insert({
        company_id: companyId,
        plan_id: plan.id,
        billing_cycle: billingCycle,
        status: 'active',
        monthly_price: plan.monthly_price,
        annual_price: plan.annual_price,
        started_at: now.toISOString(),
        last_payment_date: now.toISOString(),
        next_billing_date: nextBilling.toISOString(),
        created_by: userId
      });
  }

  // Atualizar status da organização
  await supabase
    .from('organizational_structure')
    .update({
      subscription_status: 'active',
      subscription_plan_id: plan.id,
      subscription_started_at: now.toISOString(),
      billing_cycle: billingCycle
    })
    .eq('id', companyId);

  console.log(`Subscription activated for company ${companyId}`);
}
