import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { CartItem } from '@/contexts/CartContext';

// Add debug logging
console.log('Environment variables check:', {
  hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY in environment variables');
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

if (!process.env.NEXT_PUBLIC_SITE_URL) {
  console.error('Missing NEXT_PUBLIC_SITE_URL in environment variables');
  throw new Error('NEXT_PUBLIC_SITE_URL is not defined in environment variables');
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

    const origin = headers().get('origin') || process.env.NEXT_PUBLIC_SITE_URL;

    const successUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/checkout/cancel`;

    console.log('Success URL length:', successUrl.length);
    console.log('Cancel URL length:', cancelUrl.length);

    // Convert time label to actual time
    const convertTimeLabel = (label: string): string => {
      switch (label.toLowerCase()) {
        case 'lunch':
          return '12:00:00';
        case 'dinner':
          return '18:00:00';
        default:
          return label;
      }
    };

    // Store meal details in metadata for the webhook
    const mealDetails = items.map(item => ({
      id: item.meal.id,
      title: item.meal.title,
      quantity: item.quantity,
      available_quantity: item.meal.available_quantity,
      price: item.meal.price,
      time_available: convertTimeLabel(item.meal.time_available),
      date_available: item.meal.date_available
    }));

    console.log('Creating checkout session with meals:', JSON.stringify(mealDetails, null, 2));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item) => ({
        price_data: {
          currency: 'aud',
          product_data: {
            name: item.meal.title,
            description: item.meal.description,
            metadata: {
              meal_id: item.meal.id,
              original_quantity: item.meal.available_quantity
            }
          },
          unit_amount: Math.round(item.meal.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: {
        customerPhone: customerPhone,
        meal_details: JSON.stringify(mealDetails)
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Detailed error in checkout session:', error);
    return NextResponse.json(
      { 
        error: 'Error creating checkout session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
