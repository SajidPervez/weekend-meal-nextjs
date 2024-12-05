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

interface MealDetail {
  id: string;
  title: string;
  quantity: number;
  available_quantity: number;
}

async function updateMealQuantities(session: Stripe.Checkout.Session) {
  console.log('Starting to update meal quantities...');
  
  if (!session.metadata?.meal_details) {
    console.error('No meal details found in session metadata');
    return;
  }

  try {
    const mealDetails: MealDetail[] = JSON.parse(session.metadata.meal_details);
    console.log('Parsed meal details:', mealDetails);

    for (const meal of mealDetails) {
      console.log(`Processing meal: ${meal.title} (ID: ${meal.id}), Quantity: ${meal.quantity}`);

      // Get current meal data to verify quantity
      const { data: currentMeal, error: fetchError } = await supabase
        .from('meals')
        .select('id, title, available_quantity')
        .eq('id', meal.id)
        .single();

      if (fetchError) {
        console.error(`Error fetching meal ${meal.id}:`, fetchError);
        continue;
      }

      if (!currentMeal) {
        console.error(`Meal not found: ${meal.id}`);
        continue;
      }

      console.log(`Current quantity for ${meal.title}: ${currentMeal.available_quantity}`);
      const newQuantity = Math.max(0, currentMeal.available_quantity - meal.quantity);
      console.log(`Updating quantity to: ${newQuantity}`);

      const { error: updateError } = await supabase
        .from('meals')
        .update({ available_quantity: newQuantity })
        .eq('id', meal.id);

      if (updateError) {
        console.error(`Error updating meal ${meal.id}:`, updateError);
      } else {
        console.log(`Successfully updated quantity for ${meal.title} to ${newQuantity}`);
      }
    }
  } catch (error) {
    console.error('Error parsing meal details:', error);
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  try {
    console.log('Processing checkout session:', session.id);
    
    // Update meal quantities using session metadata
    await updateMealQuantities(session);

    // Send confirmation email
    if (session.customer_details?.email) {
      try {
        // Retrieve the session with line items for the email
        const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items.data']
        });

        await sendReceiptEmail(session.customer_details.email, {
          sessionId: session.id,
          amount: session.amount_total || 0,
          items: expandedSession.line_items?.data.map(item => ({
            name: item.description || 'Product',
            quantity: item.quantity || 1,
            price: (item.amount_total || 0) / 100
          })) || []
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
    console.log('Received webhook event');
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log('Webhook event type:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session);
      console.log('Successfully processed checkout completion');
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
