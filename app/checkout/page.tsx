'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { loadStripe } from '@stripe/stripe-js';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const { items, getTotalPrice, removeFromCart, updateQuantity } = useCart();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!email || !phone) {
      setError('Email and phone are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to initialize');

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          customerEmail: email,
          customerPhone: phone,
        }),
      });

      const { sessionId, error: apiError } = await response.json();

      if (apiError) throw new Error(apiError);

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (stripeError) throw stripeError;

    } catch (err) {
      console.error('Checkout error:', err);
      setError('An error occurred during checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-xl mb-4">Your cart is empty</p>
        <Link 
          href="/"
          className="text-emerald-600 hover:text-emerald-700 inline-flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Link 
        href="/"
        className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Continue Shopping
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left side - Cart Items */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Your Cart</h2>
          {items.map((item) => (
            <div 
              key={item.meal.id} 
              className="flex gap-4 p-4 bg-white rounded-lg shadow"
            >
              <div className="relative w-24 h-24">
                {item.meal.image_urls?.[0] && (
                  <Image
                    src={item.meal.image_urls[0]}
                    alt={item.meal.title}
                    fill
                    className="object-cover rounded"
                  />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{item.meal.title}</h3>
                <p className="text-gray-600">${item.meal.price.toFixed(2)}</p>
                <div className="flex items-center gap-4 mt-2">
                  <select
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.meal.id, parseInt(e.target.value))}
                    className="rounded border p-1"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeFromCart(item.meal.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  ${(item.meal.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Right side - Checkout Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-6">Checkout</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div className="border-t pt-4 mt-6">
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>${getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${getTotalPrice().toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded">
                {error}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 