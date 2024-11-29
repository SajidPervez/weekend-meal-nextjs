// components/MealCard.tsx
'use client';

import { Card } from './card';
import { Meal } from "@/types/meal";
import { useRouter } from "next/navigation";
import { useState, useEffect } from 'react';

interface MealCardProps {
  meal: Meal;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function MealCard({ meal, onEdit, onDelete }: MealCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (meal.image_urls?.[0]) {
      console.log('Attempting to load image:', meal.image_urls[0]);
    }
  }, [meal.image_urls]);

  const handleBookNow = () => {
    router.push(`/book/${meal.id}`);
  };

  const handleEdit = () => {
    if (onEdit) onEdit(meal.id);
  };

  const handleDelete = () => {
    if (onDelete) onDelete(meal.id);
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully:', meal.image_urls?.[0]);
    setImageLoaded(true);
  };

  const handleImageError = () => {
    console.error('Failed to load image:', meal.image_urls?.[0]);
    setImageError(true);
  };

  return (
    <Card className="w-full">
      <div className="relative h-3/4 w-full overflow-hidden bg-gray-100">
        {meal.image_urls?.[0] && !imageError && (
          <img
            src={meal.image_urls[0]}
            alt={meal.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
        {(!meal.image_urls?.[0] || imageError) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <span className="text-gray-400">No image available</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold">{meal.title}</h3>
          <p className="text-2xl font-bold">${meal.price.toFixed(2)}</p>
        </div>
        <p className="text-gray-600 mb-4">{meal.description}</p>
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
