'use client';

import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { ArrowLeft, Search, MapPin, Menu } from "lucide-react"
import Link from "next/link"
import { supabase } from '@/lib/supabase';
import type { Meal } from '@/types/meal';
import MealCard from '@/components/ui/MealCard';

export default function HomePage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

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
      
      setMeals(data || []);
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
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between bg-white fixed w-full z-10 border-b">
        <Link href="/menu" className="flex items-center text-yellow-500">
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span className="text-sm">Back to Full Menu</span>
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
        <section className="w-full py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold text-center mb-8">
              Big Mac®
            </h1>
            <div className="relative w-full aspect-square max-w-2xl mx-auto mb-8">
              <img
                src="/images/big-mac.png"
                alt="Big Mac"
                className="w-full h-full object-contain"
              />
              <button className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <ArrowLeft className="h-8 w-8 text-yellow-500" />
              </button>
              <button className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <ArrowLeft className="h-8 w-8 text-yellow-500 rotate-180" />
              </button>
            </div>
            <div className="flex justify-center gap-4 mb-8">
              <img src="/images/mymaccas-logo.png" alt="MyMaccas" className="h-12" />
              <img src="/images/mcdelivery-logo.png" alt="McDelivery" className="h-12" />
            </div>
            <p className="text-center text-gray-700 max-w-2xl mx-auto">
              It starts with two 100% Aussie beef patties. Then comes the delicious combination of
              crisp iceberg lettuce, melting signature cheese, onions and pickles, between a toasted
              sesame seed bun. And don&apos;t forget the McDonald&apos;s special sauce!
            </p>
          </div>
        </section>

        <section className="w-full py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">More Menu Items</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {meals.map((meal) => (
                <div key={meal.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <MealCard meal={meal} />
                  <div className="p-4">
                    <Button 
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                      onClick={() => console.log(`Order ${meal.id}`)}
                    >
                      Order Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
