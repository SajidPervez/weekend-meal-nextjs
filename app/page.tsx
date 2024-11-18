'use client';

import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Facebook, Instagram, Utensils } from "lucide-react"
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
      <header className="px-4 lg:px-6 h-14 flex items-center bg-white bg-opacity-90 backdrop-blur-md fixed w-full z-10">
        <Link className="flex items-center justify-center" href="#">
          <Utensils className="h-6 w-6" />
          <span className="ml-2 text-xl font-bold">Tasty Bites</span>
        </Link>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 relative overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200">
          <div className="absolute inset-0 bg-grid-pattern opacity-10 animate-grid"></div>
          <div className="container px-4 md:px-6 relative z-20 flex flex-col md:flex-row items-center justify-between">
            <div className="max-w-xl bg-white/80 backdrop-blur-sm p-6 rounded-lg md:mr-8">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none mb-4 text-gray-900">
                Delicious Meals, Delivered to You
              </h1>
              <p className="max-w-[600px] text-gray-700 md:text-xl mb-6">
                Discover our chef&apos;s special: Chicken Biryani
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  Order Now
                </Button>
              </div>
            </div>
            <div className="relative mt-8 md:mt-0 w-full max-w-md">
              <div className="relative w-full h-[400px] animate-float">
                <img
                  src="/images/chicken-biryani.jpg"
                  alt="Special Meal"
                  className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-8">Available Meals</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {meals.map((meal) => (
                <MealCard key={meal.id} meal={meal} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-gray-800 text-white">
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} Tasty Bites. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
        <div className="flex gap-4 mt-4 sm:mt-0">
          <Link href="#" aria-label="Facebook">
            <Facebook className="h-5 w-5 text-gray-400 hover:text-white" />
          </Link>
          <Link href="#" aria-label="Instagram">
            <Instagram className="h-5 w-5 text-gray-400 hover:text-white" />
          </Link>
          <Link href="#" aria-label="TikTok">
            <svg
              className="h-5 w-5 text-gray-400 hover:text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
            </svg>
          </Link>
        </div>
      </footer>
    </div>
  )
}
