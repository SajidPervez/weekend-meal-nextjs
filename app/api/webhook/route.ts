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
  price: number;
  time_available: string;
  date_available: string;
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

    // Create new order
    if (session.metadata?.meal_details) {
      const mealDetails: MealDetail[] = JSON.parse(session.metadata.meal_details);
      
      // First create the order
      const { data: orderData, error: orderError } = await webhookClient
        .from('orders')
        .insert({
          user_id: null, // Will be null for guest checkouts
          total_amount: session.amount_total ? session.amount_total / 100 : 0,
          payment_status: 'paid',
          created_at: new Date().toISOString(),
          customer_email: session.customer_details?.email || '',
          customer_phone: session.customer_details?.phone || '',
          status: 'pending',
          session_id: session.id
        })
        .select()
        .single();

      if (orderError) {
        console.error('Failed to create order:', orderError);
        throw orderError;
      }

      console.log('Order created successfully:', orderData);

      // Then create order items
      const orderItems = mealDetails.map(meal => ({
        order_id: orderData.id,
        meal_id: meal.id,
        quantity: meal.quantity,
        price: meal.price || 0,
        created_at: new Date().toISOString(),
        pickup_time: meal.time_available,
        pickup_date: meal.date_available
      }));

      const { error: itemsError } = await webhookClient
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Failed to create order items:', itemsError);
        throw itemsError;
      }

      console.log('Order items created successfully');
    }

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

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';

// This is needed for Stripe webhook to work - it needs the raw body
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

    // Use constructEventAsync instead of constructEvent
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
