'use client';

import { Card } from './card';
import { Meal, MealType } from "@/types/meal";
import { useRouter } from "next/navigation";
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isAdminView = !!onEdit && !!onDelete;

  useEffect(() => {
    if (meal.image_urls?.[currentImageIndex]) {
      console.log('Attempting to load image:', meal.image_urls[currentImageIndex]);
    }
  }, [meal.image_urls, currentImageIndex]);

  const handleBookNow = () => {
    router.push(`/book/${meal.id}`);
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully:', meal.image_urls?.[currentImageIndex]);
    setImageLoaded(true);
  };

  const handleImageError = () => {
    console.error('Failed to load image:', meal.image_urls?.[currentImageIndex]);
    setImageError(true);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (meal.image_urls && meal.image_urls.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % meal.image_urls!.length);
      setImageLoaded(false);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (meal.image_urls && meal.image_urls.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? meal.image_urls!.length - 1 : prev - 1
      );
      setImageLoaded(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDisplayPrice = (meal: Meal) => {
    return meal.includes_gst ? meal.price : meal.price * (1 + meal.gst_rate);
  };

  return (
    <Card className="w-full h-full overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 group">
        {meal.image_urls?.[currentImageIndex] && !imageError && (
          <>
            <img
              src={meal.image_urls[currentImageIndex]}
              alt={`${meal.title} - Image ${currentImageIndex + 1}`}
              className={`w-full h-full object-cover transition-all duration-300 ${
                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              key={meal.image_urls[currentImageIndex]}
            />
            {meal.image_urls.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {meal.image_urls.map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
        {(!meal.image_urls?.[currentImageIndex] || imageError) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <span className="text-gray-400">No image available</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{meal.title}</h3>
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
            <p className="text-sm text-gray-500">Available: {formatDate(meal.date_available)}</p>
            {meal.size && <p className="text-sm text-gray-500">Size: {meal.size}</p>}
            {meal.is_chef_special && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 mt-1">
                👨‍🍳 Chef Special
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-emerald-600">
              ${calculateDisplayPrice(meal).toFixed(2)}
              {meal.includes_gst && <span className="text-xs ml-1">(Inc. GST)</span>}
            </p>
            <p className="text-sm text-gray-500">Pick-up: {meal.time_available}</p>
          </div>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2">{meal.description}</p>

        {isAdminView ? (
          <div className="flex gap-2">
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
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {meal.available_quantity > 0 ? (
                <span>{meal.available_quantity} left</span>
              ) : (
                <span className="text-red-500">Sold Out</span>
              )}
            </div>
            <button
              onClick={handleBookNow}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={meal.available_quantity <= 0}
            >
              {meal.available_quantity > 0 ? 'Book Now' : 'Sold Out'}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
