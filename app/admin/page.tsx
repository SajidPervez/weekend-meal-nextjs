'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from "@/components/AdminLayout";
import MealCard from '@/components/ui/MealCard';
import { supabase } from '@/lib/supabase';
import { Meal } from '@/types/meal';

export default function AdminDashboard() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log('AdminDashboard: Starting to fetch meals');
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      console.log('AdminDashboard: Fetching meals from Supabase');
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching meals:', error);
        return;
      }

      console.log('AdminDashboard: Meals fetched successfully:', data?.length || 0, 'meals');
      setMeals(data || []);
    } catch (error) {
      console.error('AdminDashboard: Unexpected error:', error);
    } finally {
      console.log('AdminDashboard: Setting loading to false');
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this meal?')) {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting meal:', error);
        return;
      }

      await fetchMeals();
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/meals?edit=${id}`);
  };

  console.log('AdminDashboard: Rendering with isLoading:', isLoading, 'meals:', meals.length);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <span className="ml-2">Loading meals...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        {meals.length === 0 ? (
          <p className="text-center text-gray-500">No meals available</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meals.map((meal) => (
              <MealCard 
                key={meal.id} 
                meal={meal} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
