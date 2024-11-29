'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import MealForm from '@/components/ui/MealForm';
import MealCard from '@/components/ui/MealCard';
import type { Meal, MealFormData } from '@/types/meal';
import AdminLayout from '@/components/AdminLayout';

export default function AdminMealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .order('date_available', { ascending: true });

    if (error) {
      console.error('Error fetching meals:', error);
      return;
    }

    if (data) {
      setMeals(data);
    }
  };

  const handleEdit = (id: number) => {
    const meal = meals.find(m => m.id === id);
    if (meal) {
      setEditingMeal(meal);
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

  const handleSubmit = async (data: MealFormData) => {
    try {
      const mealData = {
        title: data.title,
        description: data.description,
        image_urls: data.image_urls,
        price: data.price,
        available_quantity: data.available_quantity,
        date_available: data.date_available,
        time_available: data.time_available,
        size: data.size,
        available_for: data.available_for ? data.available_for.split(',') : [],
        availability_date: data.availability_date,
        recurring_pattern: data.recurring_pattern ? JSON.parse(data.recurring_pattern) : null,
      };

      if (editingMeal?.id) {
        const { error } = await supabase
          .from('meals')
          .update(mealData)
          .eq('id', editingMeal.id);

        if (error) {
          console.error('Error updating meal:', error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('meals')
          .insert([mealData]);

        if (error) {
          console.error('Error creating meal:', error);
          throw error;
        }
      }

      // Reset form and refresh meals list
      setEditingMeal(null);
      await fetchMeals();
    } catch (error) {
      console.error('Error saving meal:', error);
      alert('Failed to save meal. Please try again.');
    }
  };

  // Convert Meal to MealFormData
  const convertMealToFormData = (meal: Meal): Partial<MealFormData> => {
    return {
      id: meal.id.toString(), // Convert number to string
      title: meal.title,
      description: meal.description,
      image_urls: meal.image_urls,
      price: meal.price,
      available_quantity: meal.available_quantity,
      date_available: meal.date_available,
      time_available: meal.time_available,
      size: meal.size,
      available_for: meal.available_for ? meal.available_for.join(',') : null,
      availability_date: meal.availability_date,
      recurring_pattern: meal.recurring_pattern ? JSON.stringify(meal.recurring_pattern) : null,
    };
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">
            {editingMeal ? 'Edit Meal' : 'Manage Meals'}
          </h1>
          {!editingMeal && (
            <button
              onClick={() => setEditingMeal({ id: 0 } as Meal)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
            >
              Add New Meal
            </button>
          )}
        </div>
        
        {editingMeal ? (
          <MealForm 
            onSubmit={handleSubmit}
            initialData={convertMealToFormData(editingMeal)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
