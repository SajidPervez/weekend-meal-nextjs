'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import MealForm from '@/components/ui/MealForm';
import MealCard from '@/components/ui/MealCard';
import AdminLayout from '@/components/AdminLayout';
import type { Meal, MealFormData } from '@/types/meal';

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
    const mealData = {
      title: data.title,
      description: data.description,
      image_urls: data.image_urls,  // Updated to use image_urls
      price: data.price,
      available_quantity: data.available_quantity,
      date_available: data.date_available,
      time_available: data.time_available,
      size: data.size,
      available_for: data.available_for,
      availability_date: data.availability_date,
      recurring_pattern: data.recurring_pattern,
    };

    if (editingMeal) {
      const { error } = await supabase
        .from('meals')
        .update(mealData)
        .eq('id', editingMeal.id);

      if (error) {
        console.error('Error updating meal:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('meals')
        .insert([mealData]);

      if (error) {
        console.error('Error creating meal:', error);
        return;
      }
    }

    setEditingMeal(null);
    await fetchMeals();
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
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">
          {editingMeal ? 'Edit Meal' : 'Add New Meal'}
        </h1>
        
        <MealForm 
          onSubmit={handleSubmit}
          initialData={editingMeal ? convertMealToFormData(editingMeal) : undefined}
        />

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Existing Meals</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
      </div>
    </AdminLayout>
  );
}
