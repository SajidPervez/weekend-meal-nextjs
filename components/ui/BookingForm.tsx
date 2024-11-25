'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
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
  const [imageError, setImageError] = useState(false);

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
      
      {/* Rest of your existing BookingForm JSX */}
      
      <button
        onClick={handleAddToCart}
        className="w-full bg-emerald-600 text-white py-2 px-4 rounded hover:bg-emerald-700"
        disabled={meal.available_quantity <= 0}
      >
        {meal.available_quantity > 0 ? 'Add to Cart' : 'Sold Out'}
      </button>
    </div>
  );
}