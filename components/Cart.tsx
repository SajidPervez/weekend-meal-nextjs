'use client';

import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { ShoppingCart, X } from 'lucide-react';

export default function Cart() {
  const { items, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const router = useRouter();

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 w-80">
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
                  className="w-16 rounded border"
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
            onClick={handleCheckout}
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded hover:bg-emerald-700"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
} 