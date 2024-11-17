// components/MealCard.tsx
'use client';

import { Card } from './card';
import { Meal } from "@/types/meal";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from 'react';

interface MealCardProps {
  meal: Meal;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

export default function MealCard({ meal, onEdit, onDelete, isAdmin = false }: MealCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const handleBookNow = () => {
    router.push(`/book/${meal.id}`);
  };

  return (
    <Card className="w-full">
      {meal.main_image_url && !imageError && (
        <div className="relative h-48 w-full">
          <img
            src={meal.main_image_url}
            alt={meal.title}
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => {
              console.error('Failed to load image:', meal.main_image_url);
              setImageError(true);
            }}
          />
        </div>
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
        {onEdit && onDelete ? (
          <div className="space-x-2">
            <button
              onClick={onEdit}
              className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        ) : (
          <button
            onClick={handleBookNow}
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded hover:bg-emerald-700 transition-colors"
            disabled={meal.available_quantity <= 0}
          >
            {meal.available_quantity > 0 ? 'Book Now' : 'Sold Out'}
          </button>
        )}
      </div>
    </Card>
  );
}
