'use client';

import React, { useEffect, useState } from 'react'
import { Utensils, Search, MapPin, Menu, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { supabase } from '@/lib/supabase';
import type { Meal } from '@/types/meal';
import MealCard from '@/components/ui/MealCard';

export default function HomePage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [featuredMeal, setFeaturedMeal] = useState<Meal | null>(null);
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
        setMeals(data); // Now including the featured meal in the grid
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

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <p>Loading meals...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between bg-white fixed w-full z-10 border-b">
        <Link href="/" className="flex items-center text-emerald-600">
          <Utensils className="h-6 w-6" />
          <span className="ml-2 text-xl font-bold">Tasty Bites</span>
        </Link>
        <div className="flex items-center gap-4">
          <button aria-label="Search">
            <Search className="h-6 w-6" />
          </button>
          <button aria-label="Location">
            <MapPin className="h-6 w-6" />
          </button>
          <button aria-label="Menu">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>
      <main className="flex-1 pt-14">
        {featuredMeal ? (
          <section className="w-full py-12 px-4">
            <div className="container mx-auto max-w-4xl">
              <h1 className="text-4xl md:text-6xl font-bold text-center mb-8">
                {featuredMeal.title}
              </h1>
              <div className="w-full max-w-2xl mx-auto mb-8">
                <div className="relative w-full h-[500px]">
                  {featuredMeal.image_urls?.[currentImageIndex] && (
                    <Image
                      src={featuredMeal.image_urls[currentImageIndex]}
                      alt={`${featuredMeal.title} - Image ${currentImageIndex + 1}`}
                      fill
                      priority
                      quality={100}
                      className="object-contain"
                      onError={() => {
                        console.error('Image failed to load:', featuredMeal.image_urls[currentImageIndex]);
                      }}
                    />
                  )}
                </div>
                {featuredMeal.image_urls?.length > 1 && (
                  <div className="flex justify-between mt-4">
                    <button 
                      onClick={handlePrevImage}
                      className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50"
                    >
                      <ArrowLeft className="h-6 w-6 text-emerald-600" />
                    </button>
                    <button 
                      onClick={handleNextImage}
                      className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50"
                    >
                      <ArrowLeft className="h-6 w-6 text-emerald-600 rotate-180" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-center text-gray-700 max-w-2xl mx-auto">
                {featuredMeal.description}
              </p>
            </div>
          </section>
        ) : (
          <div className="w-full py-12 px-4 text-center">
            No featured meal available
          </div>
        )}

        <section className="w-full py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Menu Items</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {meals.map((meal) => (
                <div key={meal.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <MealCard meal={meal} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
