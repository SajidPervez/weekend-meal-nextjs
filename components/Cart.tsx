'use client';

import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { ShoppingCart, X } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';
import CheckoutModal from './ui/CheckoutModal';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function Cart() {
  const { items, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCheckoutSubmit = async (email: string, phone: string) => {
    try {
      setLoading(true);
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

      if (apiError) {
        console.error('API Error:', apiError);
        alert('Error creating checkout session. Please try again.');
        return;
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        console.error('Stripe Error:', stripeError);
        alert('Error redirecting to checkout. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('An error occurred during checkout. Please try again.');
    } finally {
      setLoading(false);
      setIsModalOpen(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <CheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCheckoutSubmit}
      />
      
      <div className="fixed bottom-0 right-0 z-40 w-full sm:bottom-4 sm:right-4 sm:w-auto">
        {/* Mobile View */}
        <div className="bg-white shadow-lg p-4 border-t sm:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-semibold">{items.length} items</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold">${getTotalPrice().toFixed(2)}</span>
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={loading}
                className="bg-emerald-600 text-white py-2 px-4 rounded hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Checkout'}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden sm:block">
          <div className="bg-white shadow-lg p-4 w-80 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Cart ({items.length})
              </h3>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {items.map((item) => (
                <div key={item.meal.id} className="flex items-center justify-between py-2 border-b">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.meal.title}</h4>
                    <p className="text-sm text-gray-600">${item.meal.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.meal.id, parseInt(e.target.value))}
                      className="w-16 rounded border p-2"
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
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between mb-4">
                <span className="font-semibold">Total:</span>
                <span className="font-semibold">${getTotalPrice().toFixed(2)}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-2 px-4 rounded hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Proceed to Checkout'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}