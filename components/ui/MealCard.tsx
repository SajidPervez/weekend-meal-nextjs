// components/MealCard.tsx
'use client';

import { Card } from './card';
import { Meal, MealType } from "@/types/meal";
import { useRouter } from "next/navigation";
import { useState, useEffect } from 'react';

interface MealCardProps {
  meal: Meal;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const mealTypeIcons: Record<MealType, string> = {
  vegan: '🌱',
  vegetarian: '🥗',
  chicken: '🍗',
  lamb: '🐑',
  beef: '🥩'
};

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

  const handleImageLoad = () => {
    console.log('Image loaded successfully:', meal.image_urls?.[0]);
    setImageLoaded(true);
  };

  const handleImageError = () => {
    console.error('Failed to load image:', meal.image_urls?.[0]);
    setImageError(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short', // "Sun"
      day: '2-digit',   // "08"
      month: 'short',   // "Nov"
      year: 'numeric'   // "2024"
    });
  };

  const calculateDisplayPrice = (meal: Meal) => {
    return meal.includes_gst ? meal.price : meal.price * (1 + meal.gst_rate);
  };

  return (
    <Card className="w-full h-full overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {meal.image_urls?.[0] && !imageError && (
          <img
            src={meal.image_urls[0]}
            alt={meal.title}
            className={`w-full h-full object-cover transition-all duration-300 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            key={meal.image_urls[0]}
          />
        )}
        {(!meal.image_urls?.[0] || imageError) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <span className="text-gray-400">No image available</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold">{meal.title}</h3>
            <div className="flex flex-wrap gap-2">
              {meal.is_chef_special && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-amber-100 text-amber-800">
                  👨‍🍳 Chef Special
                </span>
              )}
              {meal.meal_types.map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center text-lg cursor-help"
                  title={type.charAt(0).toUpperCase() + type.slice(1)}
                >
                  {mealTypeIcons[type]}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-emerald-600">
              ${calculateDisplayPrice(meal).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">Inc. GST</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{meal.description}</p>
        <div className="space-y-1 text-sm text-gray-600 mb-4">
          <p>Quantity: {meal.available_quantity}</p>
          <p>Available On: {formatDate(meal.date_available)}</p>
          <p>Pick-up: {meal.time_available}</p>
          {meal.size && <p>Size: {meal.size}</p>}
        </div>
        {onEdit && onDelete ? (
          <div className="flex gap-2 mt-auto">
            <button
              onClick={() => onEdit(meal.id)}
              className="flex-1 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-md hover:bg-emerald-200 transition-colors text-sm font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(meal.id)}
              className="flex-1 bg-red-100 text-red-700 px-3 py-1.5 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
            >
              Delete
            </button>
          </div>
        ) : (
          <button
            onClick={handleBookNow}
            className="w-full bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={meal.available_quantity <= 0}
          >
            {meal.available_quantity > 0 ? 'Book Now' : 'Sold Out'}
          </button>
        )}
      </div>
    </Card>
  );
}
