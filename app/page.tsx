'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Utensils } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from '@/lib/supabase';
import type { Meal, MealType } from '@/types/meal';
import MealCard from '@/components/ui/MealCard';
import MealFilters from '@/components/ui/MealFilters';

export default function HomePage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [chefSpecials, setChefSpecials] = useState<Meal[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<MealType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSpecialIndex, setCurrentSpecialIndex] = useState(0);

  useEffect(() => {
    fetchMeals();
    
    // Start auto-scroll for chef specials
    const interval = setInterval(() => {
      setCurrentSpecialIndex((prev) => 
        prev === chefSpecials.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [chefSpecials.length]);

  const handleBookSpecial = () => {
    if (chefSpecials[currentSpecialIndex]) {
      window.location.href = `/book/${chefSpecials[currentSpecialIndex].id}`;
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

  const fetchMeals = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch all meals available from today onwards
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .gte('date_available', today)
        .order('date_available', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        // Separate chef specials from regular meals
        const specials = data.filter(meal => meal.is_chef_special === true);
        const regular = data.filter(meal => !meal.is_chef_special);
        
        console.log('Chef Specials:', specials); // Debug log
        console.log('Regular Meals:', regular); // Debug log
        
        setChefSpecials(specials);
        setMeals(regular);
      } else {
        setChefSpecials([]);
        setMeals([]);
      }
    } catch (error) {
      console.error('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
  };

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
        {chefSpecials.length > 0 ? (
          <section className="w-full py-8 px-4 bg-gray-100 relative">
            <div className="absolute inset-0 bg-fixed bg-cover bg-center animate-pulse" style={{ backgroundImage: 'url(/path-to-minimalist-background.jpg)' }}></div>
            <div className="container mx-auto max-w-7xl relative z-10">
              {/* Reduced padding-bottom from pb-20 to pb-12 */}
              <div className="pb-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  {/* Left side - Meal Details */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <span className="text-emerald-600 font-semibold">Chef Special</span>
                      <h1 className="text-4xl md:text-6xl font-bold">
                        {chefSpecials[currentSpecialIndex].title}
                      </h1>
                      <p className="text-gray-600 text-lg">
                        {chefSpecials[currentSpecialIndex].description}
                      </p>
                      <div className="flex flex-col gap-2 text-gray-600">
                        <p className="flex items-center gap-2">
                          <span className="font-medium">Available:</span> 
                          {formatDate(chefSpecials[currentSpecialIndex].date_available)}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-medium">Pick-up:</span> 
                          {chefSpecials[currentSpecialIndex].time_available}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-medium">Quantity:</span> 
                          <span className={chefSpecials[currentSpecialIndex].available_quantity <= 0 ? "text-red-600" : "text-emerald-600"}>
                            {chefSpecials[currentSpecialIndex].available_quantity <= 0 
                              ? "Sold Out" 
                              : `${chefSpecials[currentSpecialIndex].available_quantity} remaining`}
                          </span>
                        </p>
                        {chefSpecials[currentSpecialIndex].size && (
                          <p className="flex items-center gap-2">
                            <span className="font-medium">Size:</span> 
                            {chefSpecials[currentSpecialIndex].size}
                          </p>
                        )}
                        <p className="flex items-center gap-2">
                          <span className="font-medium">Type:</span>
                          <div className="flex gap-2">
                            {chefSpecials[currentSpecialIndex].meal_types.map((type, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800">
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </span>
                            ))}
                          </div>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-medium">Price:</span>
                          <span className="text-xl font-bold text-emerald-600">
                            ${chefSpecials[currentSpecialIndex].price.toFixed(2)}
                            {chefSpecials[currentSpecialIndex].includes_gst && 
                              <span className="text-sm font-normal ml-1">(Inc. GST)</span>
                            }
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={handleBookSpecial}
                        className="mt-4 bg-emerald-600 text-white px-8 py-3 rounded-md hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={chefSpecials[currentSpecialIndex].available_quantity <= 0}
                      >
                        {chefSpecials[currentSpecialIndex].available_quantity > 0 ? 'Book Now' : 'Sold Out'}
                      </button>
                    </div>
                  </div>

                  {/* Right side - Image */}
                  <div className="relative h-[500px] w-full">
                    {chefSpecials[currentSpecialIndex].image_urls?.[0] && (
                      <Image
                        src={chefSpecials[currentSpecialIndex].image_urls[0]}
                        alt={chefSpecials[currentSpecialIndex].title}
                        fill
                        priority
                        quality={100}
                        className="object-cover rounded-lg"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation dots and counter - Positioned below the content */}
              {chefSpecials.length > 1 && (
                <div className="absolute left-0 right-0 -bottom-6 flex flex-col items-center gap-2">
                  {/* Dots for navigation */}
                  <div className="flex justify-center gap-2">
                    {chefSpecials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSpecialIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentSpecialIndex
                            ? 'bg-emerald-600 w-4' // Make active dot wider
                            : 'bg-white/80 hover:bg-white'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                  {/* Counter text */}
                  <div className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-white text-sm">
                      {currentSpecialIndex + 1} of {chefSpecials.length}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : (
          <div className="w-full py-12 px-4 text-center">
            No featured meals available
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
