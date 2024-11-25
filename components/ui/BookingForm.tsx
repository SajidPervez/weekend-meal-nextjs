'use client';

import { useState } from 'react';
import { Meal } from "@/types/meal";
import { useCart } from '@/contexts/CartContext';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface BookingFormProps {
  meal: Meal;
}

export default function BookingForm({ meal }: BookingFormProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    addToCart(meal, quantity);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left side - Image and Meal Details */}
        <div className="rounded-lg overflow-hidden border border-gray-200">
          {meal.image_urls?.[0] && (
            <div className="relative h-96 w-full">
              <img
                src={meal.image_urls[0]}
                alt={meal.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {!meal.image_urls?.[0] && (
            <div className="h-96 w-full flex items-center justify-center bg-gray-100">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">{meal.title}</h2>
            <p className="text-gray-600 mb-4">{meal.description}</p>
            <div className="space-y-2">
              <p><strong>Price:</strong> ${meal.price.toFixed(2)}</p>
              <p><strong>Available:</strong> {meal.available_quantity}</p>
              <p><strong>Pick-up:</strong> {meal.time_available}</p>
              {meal.size && <p><strong>Size:</strong> {meal.size}</p>}
            </div>
          </div>
        </div>

        {/* Right side - Quantity Selection and Add to Cart */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2">
              Quantity:
            </label>
            <input
              type="number"
              min="1"
              max={meal.available_quantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between mb-4">
              <span>Price per item:</span>
              <span>${meal.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-4 text-lg font-bold">
              <span>Total Price:</span>
              <span>${(meal.price * quantity).toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 transition-colors"
            disabled={meal.available_quantity <= 0}
          >
            {meal.available_quantity > 0 ? 'Add to Cart' : 'Sold Out'}
          </button>
        </div>
      </div>
    </div>
  );
}