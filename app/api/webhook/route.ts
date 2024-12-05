import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { webhookClient } from '@/lib/supabase-webhook';
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
  console.log('🚀 Starting to update meal quantities...');
  console.log('📦 Session metadata:', session.metadata);
  
  if (!session.metadata?.meal_details) {
    console.error('❌ No meal details found in session metadata');
    return;
  }

  try {
    const mealDetails: MealDetail[] = JSON.parse(session.metadata.meal_details);
    console.log('📋 Parsed meal details:', JSON.stringify(mealDetails, null, 2));

    for (const meal of mealDetails) {
      if (!meal.id || !meal.quantity) {
        console.error('❌ Invalid meal data:', meal);
        continue;
      }

      console.log(`\n🔄 Processing meal: ID=${meal.id}, Title=${meal.title}, OrderQuantity=${meal.quantity}`);

      // Get current meal data to ensure we have the latest quantity
      console.log('🔍 Fetching current meal data...');
      const { data: currentMeal, error: fetchError } = await webhookClient
        .from('meals')
        .select('id, title, available_quantity')
        .eq('id', meal.id)
        .single();

      if (fetchError) {
        console.error(`❌ Error fetching meal ${meal.id}:`, fetchError);
        console.error('Full fetch error:', JSON.stringify(fetchError, null, 2));
        throw fetchError; // Throw to trigger retry
      }

      if (!currentMeal) {
        console.error(`❌ Meal not found with ID: ${meal.id}`);
        throw new Error(`Meal not found: ${meal.id}`);
      }

      console.log('📊 Current meal data:', JSON.stringify(currentMeal, null, 2));

      // Calculate new quantity
      const newQuantity = Math.max(0, currentMeal.available_quantity - meal.quantity);
      console.log(`🧮 Calculating new quantity: ${currentMeal.available_quantity} - ${meal.quantity} = ${newQuantity}`);

      // Update the meal quantity
      console.log(`🔄 Attempting to update meal ${meal.id} with new quantity: ${newQuantity}`);
      
      // Log the Supabase client auth context
      const { data: authData, error: authError } = await webhookClient.auth.getSession();
      console.log('🔑 Supabase client auth context:', {
        session: authData?.session ? 'Present' : 'None',
        error: authError ? 'Error checking auth' : 'None'
      });
      
      const { data: updateData, error: updateError } = await webhookClient
        .from('meals')
        .update({ 
          available_quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', meal.id)
        .select()
        .single();

      if (updateError) {
        console.error(`❌ Error updating meal ${meal.id}:`, updateError);
        console.error('Full update error:', JSON.stringify(updateError, null, 2));
        throw updateError; // Throw error to trigger webhook retry
      }

      if (!updateData) {
        console.error(`❌ No data returned after update for meal ${meal.id}`);
        throw new Error(`Update failed for meal: ${meal.id}`);
      }

      console.log(`✅ Successfully updated meal ${meal.id}:`, JSON.stringify(updateData, null, 2));
      
      // Verify the update
      const { data: verifyData, error: verifyError } = await webhookClient
        .from('meals')
        .select('id, title, available_quantity')
        .eq('id', meal.id)
        .single();
        
      if (verifyError) {
        console.error(`❌ Error verifying update for meal ${meal.id}:`, verifyError);
      } else {
        console.log(`✅ Verified update for meal ${meal.id}:`, JSON.stringify(verifyData, null, 2));
      }
    }
  } catch (error) {
    console.error('❌ Error processing meal details:', error);
    throw error;
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  try {
    console.log('Processing checkout session:', session.id);
    
    // Update meal quantities
    await updateMealQuantities(session);

    // Send confirmation email
    if (session.customer_details?.email) {
      try {
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

export async function POST(request: Request) {
  try {
    const signature = headers().get('stripe-signature');
    
    console.log('🔍 Received webhook request');
    console.log('📝 Signature present:', !!signature);

    if (!signature) {
      console.error('❌ No stripe signature found in headers');
      return NextResponse.json(
        { error: 'No stripe signature found' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get the raw body
    const rawBody = await request.text();
    console.log('📝 Raw body length:', rawBody.length);

    try {
      console.log('🔐 Verifying Stripe signature...');
      console.log('🔑 Using webhook secret starting with:', process.env.STRIPE_WEBHOOK_SECRET.substring(0, 4));
      
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log('✅ Webhook signature verified');
      console.log('📦 Event type:', event.type);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('🔍 Checkout Session ID:', session.id);
        console.log('📦 Raw metadata:', session.metadata);
        
        try {
          await handleCheckoutComplete(session);
          console.log('✅ Successfully processed checkout completion');
        } catch (processError) {
          console.error('❌ Error processing checkout:', processError);
          // Return 500 to trigger a retry from Stripe
          return NextResponse.json(
            { error: 'Error processing checkout', details: processError instanceof Error ? processError.message : 'Unknown error' },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({ received: true });
    } catch (err) {
      console.error('❌ Error constructing webhook event:', err);
      console.error('🔑 Secret prefix used:', process.env.STRIPE_WEBHOOK_SECRET?.slice(0, 4));
      console.error('📝 Signature received:', signature);
      return NextResponse.json(
        { error: 'Webhook signature verification failed', details: err instanceof Error ? err.message : 'Unknown error' },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error('❌ Unexpected webhook error:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 }
    );
  }
}

// Configure the endpoint to accept raw body
export const config = {
  api: {
    bodyParser: false,
  },
};
