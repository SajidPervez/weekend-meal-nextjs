'use client';

import { useState } from 'react';
import { Meal } from "@/types/meal";
import { useCart } from '@/contexts/CartContext';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BookingFormProps {
  meal: Meal;
}

export default function BookingForm({ meal }: BookingFormProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleAddToCart = async () => {
    addToCart(meal, quantity);
    // Wait a bit to ensure the cart state is saved
    await new Promise(resolve => setTimeout(resolve, 100));
    setShowSuccess(true);
  };

  const handleAddAnother = async () => {
    addToCart(meal, quantity);
    // Wait a bit to ensure the cart state is saved
    await new Promise(resolve => setTimeout(resolve, 100));
    router.replace('/', { scroll: false });
  };

  if (showSuccess) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-emerald-600 mb-4">Added to Cart!</h2>
          <div className="space-y-4">
            <button
              onClick={async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                router.replace('/', { scroll: false });
              }}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Another Meal
            </button>
            <button
              onClick={async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                router.replace('/checkout', { scroll: false });
              }}
              className="w-full border border-emerald-600 text-emerald-600 py-3 px-4 rounded-md hover:bg-emerald-50 transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    );
  }

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
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Meal Details */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="aspect-[4/3] relative mb-4 rounded-md overflow-hidden">
            <img
              src={meal.image_urls?.[0] || '/placeholder-meal.jpg'}
              alt={meal.title}
              className="object-cover w-full h-full"
            />
          </div>
          <h2 className="text-xl font-semibold mb-4">{meal.title}</h2>
          <div className="space-y-3 text-gray-600">
            <p>{meal.description}</p>
            <div className="flex flex-col gap-2">
              <p className="flex items-center justify-between">
                <span className="font-medium">Available Date:</span>
                <span>{formatDate(meal.date_available)}</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="font-medium">Pick-up Time:</span>
                <span>{meal.time_available}</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="font-medium">Quantity Available:</span>
                <span>{meal.available_quantity}</span>
              </p>
              {meal.size && (
                <p className="flex items-center justify-between">
                  <span className="font-medium">Size:</span>
                  <span>{meal.size}</span>
                </p>
              )}
              <p className="flex items-center justify-between">
                <span className="font-medium">Price:</span>
                <span className="text-xl font-bold text-emerald-600">${meal.price.toFixed(2)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div>
            <label className="block text-sm font-bold mb-2">
              Quantity to Order:
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

          <div className="space-y-3">
            <button
              onClick={handleAddToCart}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 transition-colors"
              disabled={meal.available_quantity <= 0}
            >
              {meal.available_quantity > 0 ? 'Add to Cart' : 'Sold Out'}
            </button>
            <button
              onClick={handleAddAnother}
              className="w-full border border-emerald-600 text-emerald-600 py-3 px-4 rounded-md hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
              disabled={meal.available_quantity <= 0}
            >
              <Plus className="w-5 h-5" />
              Add to Cart & Select Another
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}