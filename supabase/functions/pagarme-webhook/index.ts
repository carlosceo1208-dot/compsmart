import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get('PAGARME_WEBHOOK_SECRET');
    const signature = req.headers.get('x-hub-signature');

    // SECURITY: Verify webhook secret is configured
    if (!webhookSecret) {
      console.error('CRITICAL: PAGARME_WEBHOOK_SECRET not configured');
      return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Read body for signature validation
    const body = await req.text();

    // SECURITY: Validate webhook signature - REJECT if invalid
    if (signature) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
      const computedSignature = 'sha256=' + Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (signature !== computedSignature) {
        console.error('SECURITY: Invalid webhook signature detected', {
          timestamp: new Date().toISOString(),
          signatureLength: signature?.length
        });
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // SECURITY: Reject requests without signature
      console.error('SECURITY: Missing webhook signature');
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the validated body
    const event = JSON.parse(body);

    console.log('Webhook event received:', event.type);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const eventType = event.type;
    const data = event.data;

    switch (eventType) {
      case 'order.paid':
        await handleOrderPaid(supabaseAdmin, data);
        break;

      case 'order.payment_failed':
        await handlePaymentFailed(supabaseAdmin, data);
        break;

      case 'order.canceled':
        await handleOrderCanceled(supabaseAdmin, data);
        break;

      case 'charge.paid':
        await handleChargePaid(supabaseAdmin, data);
        break;

      case 'charge.payment_failed':
        await handleChargePaymentFailed(supabaseAdmin, data);
        break;

      case 'subscription.created':
        await handleSubscriptionCreated(supabaseAdmin, data);
        break;

      case 'subscription.canceled':
        await handleSubscriptionCanceled(supabaseAdmin, data);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(supabaseAdmin, data);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to send payment emails
async function sendPaymentEmail(supabase: any, type: string, data: Record<string, any>) {
  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-payment-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ type, ...data }),
    });
    
    if (!response.ok) {
      console.error('Failed to send email:', await response.text());
    } else {
      console.log(`Email sent: ${type}`);
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

async function handleOrderPaid(supabase: any, data: any) {
  console.log('Processing order.paid:', data.id);

  // Buscar checkout session pelo order_id
  const { data: checkoutSession, error } = await supabase
    .from('checkout_sessions')
    .select('*, subscription_plans(*)')
    .eq('pagarme_order_id', data.id)
    .single();

  if (error || !checkoutSession) {
    console.error('Checkout session not found for order:', data.id);
    return;
  }

  // Atualizar status do checkout
  await supabase
    .from('checkout_sessions')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString()
    })
    .eq('id', checkoutSession.id);

  // Check if this is first payment (welcome email)
  const { data: existingSubscription } = await supabase
    .from('company_subscriptions')
    .select('id')
    .eq('company_id', checkoutSession.company_id)
    .eq('status', 'active')
    .maybeSingle();

  const isFirstPayment = !existingSubscription;

  // Ativar assinatura
  if (checkoutSession.company_id) {
    await activateSubscription(
      supabase,
      checkoutSession.user_id,
      checkoutSession.company_id,
      checkoutSession.subscription_plans,
      checkoutSession.billing_cycle
    );
  }

  // Incrementar uso do cupom
  if (checkoutSession.coupon_code) {
    await supabase.rpc('increment_coupon_usage', { 
      coupon_code: checkoutSession.coupon_code 
    });
  }

  // Criar fatura
  const invoice = await createInvoice(supabase, checkoutSession, data);

  // SEND EMAILS
  const emailData = {
    userId: checkoutSession.user_id,
    companyId: checkoutSession.company_id,
    planName: checkoutSession.subscription_plans?.name,
    amount: (checkoutSession.amount_cents - (checkoutSession.discount_cents || 0)) / 100,
    paymentMethod: checkoutSession.payment_method,
    invoiceNumber: invoice?.invoice_number,
  };

  // Send payment confirmation email
  await sendPaymentEmail(supabase, 'payment_confirmed', emailData);

  // Send welcome email for first payment
  if (isFirstPayment) {
    await sendPaymentEmail(supabase, 'welcome', emailData);
  }

  console.log('Order paid processed successfully:', data.id);
}

async function handlePaymentFailed(supabase: any, data: any) {
  console.log('Processing order.payment_failed:', data.id);

  await supabase
    .from('checkout_sessions')
    .update({ status: 'failed' })
    .eq('pagarme_order_id', data.id);

  // Buscar checkout session para enviar email
  const { data: checkoutSession } = await supabase
    .from('checkout_sessions')
    .select('*, subscription_plans(*)')
    .eq('pagarme_order_id', data.id)
    .single();

  if (checkoutSession) {
    // Incrementar tentativas falhas na assinatura
    if (checkoutSession.company_id) {
      await supabase
        .from('company_subscriptions')
        .update({
          failed_attempts: supabase.sql`failed_attempts + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('company_id', checkoutSession.company_id)
        .eq('status', 'active');
    }

    // Send payment failed email
    await sendPaymentEmail(supabase, 'payment_failed', {
      userId: checkoutSession.user_id,
      companyId: checkoutSession.company_id,
      planName: checkoutSession.subscription_plans?.name,
      amount: checkoutSession.amount_cents / 100,
      failureReason: data.last_transaction?.acquirer_message || 'Pagamento recusado',
    });
  }
}

async function handleOrderCanceled(supabase: any, data: any) {
  console.log('Processing order.canceled:', data.id);

  await supabase
    .from('checkout_sessions')
    .update({ status: 'canceled' })
    .eq('pagarme_order_id', data.id);
}

async function handleChargePaid(supabase: any, data: any) {
  console.log('Processing charge.paid:', data.id);

  await supabase
    .from('checkout_sessions')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString()
    })
    .eq('pagarme_charge_id', data.id);
}

async function handleChargePaymentFailed(supabase: any, data: any) {
  console.log('Processing charge.payment_failed:', data.id);

  await supabase
    .from('checkout_sessions')
    .update({ status: 'failed' })
    .eq('pagarme_charge_id', data.id);
}

async function activateSubscription(
  supabase: any,
  userId: string,
  companyId: string,
  plan: any,
  billingCycle: string
) {
  const now = new Date();
  const nextBilling = new Date(now);
  nextBilling.setMonth(nextBilling.getMonth() + (billingCycle === 'annual' ? 12 : 1));

  // Verificar assinatura existente
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
        failed_attempts: 0,
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

  // Atualizar organizational_structure
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

async function createInvoice(supabase: any, checkoutSession: any, orderData: any) {
  const now = new Date();
  const invoiceNumber = `INV-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const subtotal = checkoutSession.amount_cents / 100;
  const discount = (checkoutSession.discount_cents || 0) / 100;
  const total = subtotal - discount;

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      company_id: checkoutSession.company_id,
      invoice_number: invoiceNumber,
      subtotal: subtotal,
      discount: discount,
      total: total,
      status: 'paid',
      due_date: now.toISOString().split('T')[0],
      paid_at: now.toISOString(),
      payment_method: checkoutSession.payment_method,
      payment_reference: orderData.id
    })
    .select()
    .single();

  if (invoice) {
    await supabase
      .from('invoice_items')
      .insert({
        invoice_id: invoice.id,
        description: `Assinatura ${checkoutSession.subscription_plans?.name} - ${checkoutSession.billing_cycle === 'annual' ? 'Anual' : 'Mensal'}`,
        quantity: 1,
        unit_price: subtotal,
        subtotal: subtotal,
        plan_id: checkoutSession.plan_id,
        item_type: 'subscription'
      });
  }

  console.log('Invoice created:', invoiceNumber);
  return invoice;
}

// ============= Subscription Event Handlers =============

async function handleSubscriptionCreated(supabase: any, data: any) {
  console.log('Processing subscription.created:', data.id);

  // Buscar company pelo customer_id do Pagar.me
  const { data: subscription } = await supabase
    .from('company_subscriptions')
    .select('id, company_id')
    .eq('pagarme_customer_id', data.customer?.id)
    .eq('status', 'active')
    .maybeSingle();

  if (subscription) {
    // Atualizar com o ID da subscription do Pagar.me
    await supabase
      .from('company_subscriptions')
      .update({
        pagarme_subscription_id: data.id,
        next_billing_date: data.next_billing_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    console.log(`Subscription ${data.id} linked to company ${subscription.company_id}`);
  } else {
    console.log('No active subscription found for customer:', data.customer?.id);
  }
}

async function handleSubscriptionCanceled(supabase: any, data: any) {
  console.log('Processing subscription.canceled:', data.id);

  const now = new Date();

  // Buscar assinatura pelo pagarme_subscription_id
  const { data: subscription } = await supabase
    .from('company_subscriptions')
    .select('id, company_id')
    .eq('pagarme_subscription_id', data.id)
    .maybeSingle();

  if (subscription) {
    // Cancelar assinatura
    await supabase
      .from('company_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: now.toISOString(),
        cancellation_reason: data.cancellation_reason || 'Cancelamento via Pagar.me',
        ended_at: data.canceled_at || now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', subscription.id);

    // Atualizar organizational_structure
    await supabase
      .from('organizational_structure')
      .update({
        subscription_status: 'canceled'
      })
      .eq('id', subscription.company_id);

    console.log(`Subscription canceled for company ${subscription.company_id}`);
  } else {
    console.log('Subscription not found for pagarme_subscription_id:', data.id);
  }
}

async function handleSubscriptionUpdated(supabase: any, data: any) {
  console.log('Processing subscription.updated:', data.id);

  // Buscar assinatura existente
  const { data: subscription } = await supabase
    .from('company_subscriptions')
    .select('id, company_id')
    .eq('pagarme_subscription_id', data.id)
    .maybeSingle();

  if (subscription) {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    // Atualizar próxima data de cobrança se disponível
    if (data.next_billing_at) {
      updateData.next_billing_date = data.next_billing_at;
    }

    // Atualizar ciclo se alterado
    if (data.interval) {
      updateData.billing_cycle = data.interval === 'year' ? 'annual' : 'monthly';
    }

    await supabase
      .from('company_subscriptions')
      .update(updateData)
      .eq('id', subscription.id);

    console.log(`Subscription updated for company ${subscription.company_id}`);
  } else {
    console.log('Subscription not found for pagarme_subscription_id:', data.id);
  }
}
