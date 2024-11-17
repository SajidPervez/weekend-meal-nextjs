// components/MealCard.tsx
'use client';

import { Card } from './card';
import { Meal } from "@/types/meal";
import { useRouter } from "next/navigation";
import { useState, useEffect } from 'react';

interface MealCardProps {
  meal: Meal;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function MealCard({ meal, onEdit, onDelete }: MealCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (meal.main_image_url) {
      console.log('Attempting to load image:', meal.main_image_url);
    }
  }, [meal.main_image_url]);

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
    console.log('Image loaded successfully:', meal.main_image_url);
    setImageLoaded(true);
  };

  const handleImageError = () => {
    console.error('Failed to load image:', meal.main_image_url);
    setImageError(true);
  };

  return (
    <Card className="w-full">
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        {meal.main_image_url && !imageError && (
          <img
            src={meal.main_image_url}
            alt={meal.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
        {(!meal.main_image_url || imageError) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
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
