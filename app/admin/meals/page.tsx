'use client';

import { useState, useEffect } from 'react';
import MealCard from '@/components/ui/MealCard';
import MealForm from '@/components/ui/MealForm';
import { supabase } from '@/lib/supabase';
import { Meal, MealFormData } from '@/types/meal';
import AdminLayout from '@/components/AdminLayout';

export default function AdminMeals() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [editingMeal, setEditingMeal] = useState<Partial<MealFormData> | null>(null);

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    const { data, error } = await supabase
      .from('meals')
      .select('*');
    if (error) console.error('Error fetching meals', error);
    else setMeals(data || []);
  };

  const handleMealSubmit = async (mealData: Partial<MealFormData>, imageFile: File | null) => {
    let imagePath = null;

    if (imageFile) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meal-images')
        .upload(`meals/${Date.now()}_${imageFile.name}`, imageFile);

      if (uploadError) {
        console.error('Error uploading image', uploadError); 
        return;
      }

      imagePath = uploadData?.path;
    }

    const mealPayload = {
      ...mealData,
      main_image_url: imagePath || editingMeal?.main_image_url,
      price: mealData.price ? parseFloat(mealData.price) : 0,
      available_quantity: mealData.available_quantity ? parseInt(mealData.available_quantity) : 0,
    };

    if (editingMeal) {
      const { error } = await supabase
        .from('meals')
        .update(mealPayload)
        .eq('id', (meals.find(m => m.title === editingMeal.title))?.id);

      if (error) console.error('Error updating meal', error);
    } else {
      const { error } = await supabase
        .from('meals')
        .insert([mealPayload]);

      if (error) console.error('Error creating meal', error);
    }

    setEditingMeal(null);
    fetchMeals();
  };

  const handleDelete = async (mealId: string) => {
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId);

    if (error) console.error('Error deleting meal', error);
    else fetchMeals();
  };

  const handleEdit = (meal: Meal) => {
    const formData: Partial<MealFormData> = {
      title: meal.title,
      description: meal.description || '',
      main_image_url: meal.main_image_url || '',
      additional_images: meal.additional_images || [],
      price: meal.price.toString(),
      available_quantity: meal.available_quantity.toString(),
      date_available: meal.date_available,
      time_available: meal.time_available,
      size: meal.size,
      available_for: meal.available_for,
      availability_date: meal.availability_date || '',
      recurring_pattern: meal.recurring_pattern,
    };
    setEditingMeal(formData);
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Admin - Manage Meals</h1>

        <MealForm 
          initialMeal={editingMeal}
          onSubmit={handleMealSubmit} 
        />

        <div className="mt-8">
          {meals.map((meal) => (
            <MealCard 
              key={meal.id} 
              meal={meal} 
              onEdit={() => handleEdit(meal)} 
              onDelete={() => handleDelete(meal.id)} 
            />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
