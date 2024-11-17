// components/MealCard.tsx
'use client';

import { Card } from './card';
import { Meal } from "@/types/meal";
import { useRouter } from "next/navigation";
import { useState } from 'react';
import Image from 'next/image';

interface MealCardProps {
  meal: Meal;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function MealCard({ meal, onEdit, onDelete }: MealCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const handleBookNow = () => {
    router.push(`/book/${meal.id}`);
  };

  const handleEdit = () => {
    if (onEdit) onEdit(meal.id);
  };

  const handleDelete = () => {
    if (onDelete) onDelete(meal.id);
  };

  return (
    <Card className="w-full">
      <div className="relative h-48 w-full">
        {meal.main_image_url && !imageError ? (
          <Image
            src={meal.main_image_url}
            alt={meal.title}
            fill
            className="object-cover"
            onError={() => {
              console.error('Failed to load image:', meal.main_image_url);
              setImageError(true);
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image available</span>
          </div>
        )}
      </div>
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
              onClick={handleEdit}
              className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
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
