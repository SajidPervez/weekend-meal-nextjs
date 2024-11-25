import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { CartItem } from '@/contexts/CartContext';

// Add debug logging
console.log('Environment variables check:', {
  hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
});

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY in environment variables');
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

interface CheckoutBody {
  items: CartItem[];
  customerEmail: string;
  customerPhone: string;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

export async function POST(req: Request) {
  try {
    const body = await req.json() as CheckoutBody;
    const { items, customerEmail, customerPhone } = body;

    if (!items?.length) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    console.log('Creating checkout session with:', {
      itemCount: items.length,
      email: customerEmail,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.meal.title,
            description: item.meal.description || undefined,
            images: item.meal.image_urls || [],
          },
          unit_amount: Math.round(item.meal.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancel`,
      customer_email: customerEmail,
      metadata: {
        customerPhone,
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Detailed error in checkout session:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 