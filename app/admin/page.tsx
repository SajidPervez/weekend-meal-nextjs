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
    checkAuthAndFetchMeals();
  }, []);

  const checkAuthAndFetchMeals = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      await fetchMeals();
    } catch (error) {
      console.error('Error:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMeals = async () => {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching meals:', error);
    } else {
      setMeals(data || []);
    }
  };

  const handleDelete = async (mealId: string) => {
    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId);

      if (error) {
        console.error('Error deleting meal:', error);
        return;
      }

      await fetchMeals();
    } catch (error) {
      console.error('Error handling meal deletion:', error);
    }
  };

  const handleEdit = (mealId: string) => {
    router.push(`/admin/meals?edit=${mealId}`);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meals.map((meal) => (
            <MealCard 
              key={meal.id} 
              meal={meal} 
              onEdit={() => handleEdit(meal.id)} 
              onDelete={() => handleDelete(meal.id)} 
            />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
