// components/MealCard.tsx
'use client';

import { Meal } from "@/types/meal";
import { useRouter } from "next/navigation";

interface MealCardProps {
  meal: Meal;
}

export default function MealCard({ meal }: MealCardProps) {
  const router = useRouter();

  const handleBookNow = () => {
    router.push(`/book/${meal.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {meal.main_image_url && (
        <img 
          src={meal.main_image_url} 
          alt={meal.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{meal.title}</h3>
        <p className="text-2xl font-bold mb-2">${meal.price.toFixed(2)}</p>
        <div className="space-y-1 text-gray-600 mb-4">
          <p>Quantity: {meal.available_quantity}</p>
          <p>Date: {new Date(meal.date_available).toLocaleDateString()}</p>
          <p>Pick-up: {meal.time_available}</p>
          {meal.size && <p>Size: {meal.size}</p>}
        </div>
        <button
          onClick={handleBookNow}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          disabled={meal.available_quantity <= 0}
        >
          {meal.available_quantity > 0 ? 'Book Now' : 'Sold Out'}
        </button>
      </div>
    </div>
  );
}
