import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendReceiptEmail } from '@/lib/email';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not defined in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

const webhookClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  try {
    console.log('Processing checkout session:', session.id);
    
    // First check if order already exists
    const { data: existingOrder } = await webhookClient
      .from('orders')
      .select('id')
      .eq('session_id', session.id)
      .single();

    if (existingOrder) {
      console.log('Order already exists for session:', session.id);
      return; // Skip processing if order exists
    }

    if (!session.metadata?.m) {
      console.error('No meal details found in session metadata');
      throw new Error('Missing meal details in session metadata');
    }

    // Parse meal details first
    const mealDetails = session.metadata.m.split('|').map(detail => {
      const [id, quantity, time, date] = detail.split(':');
      return {
        id,
        quantity: parseInt(quantity),
        time: convertTimeLabel(time),
        date
      };
    });

    // Get line items for prices
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const priceMap = new Map(
      lineItems.data.map(item => [
        item.price?.metadata?.meal_id,
        item.price?.unit_amount ? item.price.unit_amount / 100 : 0
      ])
    );

    // Start a Supabase transaction
    const { data: orderData, error: orderError } = await webhookClient
      .rpc('create_order_with_items', {
        p_session_id: session.id,
        p_user_id: null,
        p_total_amount: session.amount_total ? session.amount_total / 100 : 0,
        p_customer_email: session.customer_details?.email || '',
        p_customer_phone: session.metadata?.p || '',
        p_meal_details: JSON.stringify(mealDetails.map(meal => ({
          ...meal,
          price: priceMap.get(meal.id) || 0
        })))
      });

    if (orderError) {
      console.error('Failed to create order:', orderError);
      throw orderError;
    }

    console.log('Order and items created successfully:', orderData);

    // Send confirmation email
    if (session.customer_details?.email) {
      try {
        await sendReceiptEmail(session.customer_details.email, {
          sessionId: session.id,
          amount: session.amount_total || 0,
          items: lineItems.data.map(item => ({
            name: item.description || 'Product',
            quantity: item.quantity || 1,
            price: (item.amount_total || 0) / 100
          }))
        });
        console.log('Receipt email sent successfully');
      } catch (emailError) {
        console.error('Failed to send receipt email:', emailError);
      }
    }
  } catch (error) {
    console.error('Error in handleCheckoutComplete:', error);
    throw error;
  }
}

function convertTimeLabel(label: string): string {
  if (label.includes(':')) return label;
  switch (label.toLowerCase()) {
    case 'lunch': return '12:00:00';
    case 'dinner': return '18:00:00';
    default: return label;
  }
}

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const sig = headers().get('stripe-signature');

    if (!sig) {
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }

    const event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log('🎉 Webhook received! Event type:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('💳 Processing checkout session:', session.id);
      
      try {
        await handleCheckoutComplete(session);
        return NextResponse.json({ received: true });
      } catch (error) {
        console.error('❌ Error processing checkout session:', error);
        return NextResponse.json(
          { error: 'Error processing checkout session' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('❌ Error:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}
