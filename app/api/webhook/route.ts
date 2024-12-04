import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { sendReceiptEmail } from '@/lib/email';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

async function updateMealQuantities(lineItems: Stripe.LineItem[]) {
  for (const item of lineItems) {
    const mealName = item.description || '';
    const quantity = item.quantity || 0;

    // Get the meal from Supabase
    const { data: meals, error: fetchError } = await supabase
      .from('meals')
      .select('id, available_quantity, title')
      .eq('title', mealName)
      .limit(1);

    if (fetchError) {
      console.error('Error fetching meal:', fetchError);
      continue;
    }

    if (!meals || meals.length === 0) {
      console.error('Meal not found:', mealName);
      continue;
    }

    const meal = meals[0];
    const newQuantity = Math.max(0, meal.available_quantity - quantity);

    // Update the meal quantity
    const { error: updateError } = await supabase
      .from('meals')
      .update({ available_quantity: newQuantity })
      .eq('id', meal.id);

    if (updateError) {
      console.error('Error updating meal quantity:', updateError);
      continue;
    }

    console.log(`Updated quantity for meal "${mealName}" from ${meal.available_quantity} to ${newQuantity}`);
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  // Retrieve the session with line items
  const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ['line_items', 'line_items.data.price.product']
  });

  // Update meal quantities
  if (expandedSession.line_items) {
    await updateMealQuantities(expandedSession.line_items.data);
  }

  // Send confirmation email
  if (expandedSession.customer_details?.email) {
    try {
      await sendReceiptEmail(expandedSession.customer_details.email, {
        sessionId: expandedSession.id,
        amount: expandedSession.amount_total || 0,
        items: expandedSession.line_items?.data.map(item => ({
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
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature found' },
      { status: 400 }
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}
