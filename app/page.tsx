'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, ArrowLeft, Utensils } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from '@/lib/supabase';
import type { Meal, MealType } from '@/types/meal';
import MealCard from '@/components/ui/MealCard';
import MealFilters from '@/components/ui/MealFilters';

export default function HomePage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [featuredMeal, setFeaturedMeal] = useState<Meal | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<MealType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .gte('date_available', today)
        .order('date_available', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setFeaturedMeal(data[0]);
        setMeals(data.slice(1)); // Remove featured meal from the grid
      } else {
        setMeals([]);
      }
    } catch (error) {
      console.error('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevImage = () => {
    if (featuredMeal?.image_urls?.length) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? featuredMeal.image_urls.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (featuredMeal?.image_urls?.length) {
      setCurrentImageIndex((prev) => 
        prev === featuredMeal.image_urls.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleBookFeatured = () => {
    if (featuredMeal) {
      window.location.href = `/book/${featuredMeal.id}`;
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

  const filteredMeals = selectedTypes.length > 0
    ? meals.filter(meal => 
        meal.meal_types.some(type => selectedTypes.includes(type))
      )
    : meals;

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <p>Loading meals...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between bg-white border-b">
        <Link href="/" className="flex items-center text-emerald-600">
          <Utensils className="h-6 w-6" />
          <span className="ml-2 text-xl font-bold">Tasty Bites</span>
        </Link>
        <div className="flex items-center gap-4">
          <a href="https://www.google.com/maps/search/?api=1&query=Fawkner+Victoria+Australia" aria-label="Location" target="_blank" rel="noopener noreferrer">
            <MapPin className="h-6 w-6" />
          </a>
        </div>
      </header>
      <main className="flex-1 pt-14">
        {featuredMeal ? (
          <section className="w-full py-12 px-4 bg-gray-100 relative">
            <div className="absolute inset-0 bg-fixed bg-cover bg-center animate-pulse" style={{ backgroundImage: 'url(/path-to-minimalist-background.jpg)' }}></div>
            <div className="container mx-auto max-w-7xl relative z-10">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Left side - Meal Details */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <span className="text-emerald-600 font-semibold">Chef Special</span>
                    <h1 className="text-4xl md:text-6xl font-bold">
                      {featuredMeal.title}
                    </h1>
                    <p className="text-gray-600 text-lg">
                      {featuredMeal.description}
                    </p>
                    <div className="flex flex-col gap-2 text-gray-600">
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Available:</span> 
                        {formatDate(featuredMeal.date_available)}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Pick-up:</span> 
                        {featuredMeal.time_available}
                      </p>
                      {featuredMeal.size && (
                        <p className="flex items-center gap-2">
                          <span className="font-medium">Size:</span> 
                          {featuredMeal.size}
                        </p>
                      )}
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Price:</span>
                        <span className="text-xl font-bold text-emerald-600">
                          ${featuredMeal.price.toFixed(2)}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={handleBookFeatured}
                      className="mt-4 bg-emerald-600 text-white px-8 py-3 rounded-md hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      disabled={featuredMeal.available_quantity <= 0}
                    >
                      {featuredMeal.available_quantity > 0 ? 'Book Now' : 'Sold Out'}
                    </button>
                  </div>
                </div>

                {/* Right side - Image */}
                <div className="relative h-[500px] w-full">
                  {featuredMeal.image_urls?.[currentImageIndex] && (
                    <Image
                      src={featuredMeal.image_urls[currentImageIndex]}
                      alt={`${featuredMeal.title} - Image ${currentImageIndex + 1}`}
                      fill
                      priority
                      quality={100}
                      className="object-cover rounded-lg"
                      onError={() => {
                        console.error('Image failed to load:', featuredMeal.image_urls[currentImageIndex]);
                      }}
                    />
                  )}
                  {featuredMeal.image_urls?.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                      <button 
                        onClick={handlePrevImage}
                        className="p-2 rounded-full bg-white/80 shadow-md hover:bg-white transition-colors"
                      >
                        <ArrowLeft className="h-6 w-6 text-emerald-600" />
                      </button>
                      <button 
                        onClick={handleNextImage}
                        className="p-2 rounded-full bg-white/80 shadow-md hover:bg-white transition-colors"
                      >
                        <ArrowLeft className="h-6 w-6 text-emerald-600 rotate-180" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <div className="w-full py-12 px-4 text-center">
            No featured meal available
          </div>
        )}

        <section className="w-full py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Discover Your Next Meal</h2>
            <p className="text-center text-lg mb-8">Browse our selection of delicious, chef-prepared meals</p>
            <MealFilters
              selectedTypes={selectedTypes}
              onTypeChange={setSelectedTypes}
            />
            {filteredMeals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {selectedTypes.length > 0
                    ? 'No meals found matching the selected filters.'
                    : 'No meals available at the moment.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMeals.map((meal) => (
                  <div key={meal.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <MealCard meal={meal} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <footer className="bg-gray-800 py-4">
        <div className="container mx-auto text-center text-white">
          <div className="flex justify-center space-x-6">
            <a href="https://facebook.com" aria-label="Facebook" className="hover:text-blue-500">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="https://tiktok.com" aria-label="TikTok" className="hover:text-pink-500">
              <i className="fab fa-tiktok"></i>
            </a>
            <a href="https://instagram.com" aria-label="Instagram" className="hover:text-purple-500">
              <i className="fab fa-instagram"></i>
            </a>
          </div>
          <p className="mt-4"> 2023 Tasty Bites. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
