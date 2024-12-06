import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { webhookClient } from '@/lib/supabase-webhook';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();
    console.log('Processing refund for order:', orderId);

    // Get the order details from Supabase
    const { data: order, error: orderError } = await webhookClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      return NextResponse.json(
        { error: 'Failed to fetch order details', details: orderError },
        { status: 500 }
      );
    }

    if (!order) {
      console.error('Order not found:', orderId);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (!order.session_id) {
      console.error('No session ID found for order:', orderId);
      return NextResponse.json(
        { error: 'No payment session found for this order' },
        { status: 400 }
      );
    }

    console.log('Fetching Stripe session:', order.session_id);

    // Get the payment intent ID from Stripe Checkout Session
    const session = await stripe.checkout.sessions.retrieve(order.session_id);
    if (!session.payment_intent) {
      console.error('No payment intent found in session:', order.session_id);
      return NextResponse.json(
        { error: 'No payment found for this order' },
        { status: 400 }
      );
    }

    console.log('Processing refund for payment intent:', session.payment_intent);

    // Create a refund
    const refund = await stripe.refunds.create({
      payment_intent: session.payment_intent as string,
    });

    console.log('Refund processed:', refund.id);

    // Update order status in database
    const { error: updateError } = await webhookClient
      .from('orders')
      .update({ 
        status: 'cancelled',
        payment_status: 'refunded'
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order status', details: updateError },
        { status: 500 }
      );
    }

    console.log('Order status updated successfully');
    return NextResponse.json({ success: true, refund });
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: 'Failed to process refund', details: error },
      { status: 500 }
    );
  }
}
