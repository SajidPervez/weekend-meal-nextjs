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
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching meals:', error);
      } else {
        setMeals(data || []);
      }
    } finally {
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

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-8">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
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
      </div>
    </AdminLayout>
  );
}
