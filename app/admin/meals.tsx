'use client';

import { useState, useEffect } from 'react';
import MealCard from '@/components/ui/MealCard';
import MealForm from '@/components/ui/MealForm';
import { supabase } from '@/lib/supabase';

export default function ManageMeals() {
  const [meals, setMeals] = useState<any[]>([]);
  const [editingMeal, setEditingMeal] = useState<any | null>(null);

  useEffect(() => {
    fetchMeals();
  }, []);

  // Fetch meals from Supabase
  const fetchMeals = async () => {
    const { data, error } = await supabase
      .from('meals')
      .select('*');
    if (error) console.error('Error fetching meals', error);
    else setMeals(data || []);
  };

  // Handle meal creation or update with image upload
  const handleMealSubmit = async (mealData: any, imageFile: File | null) => {
    let imagePath = null;

    // If there's an image file, upload it to Supabase storage
    if (imageFile) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meal-images')
        .upload(`meals/${Date.now()}_${imageFile.name}`, imageFile);

      if (uploadError) {
        console.error('Error uploading image', uploadError);
        return;
      }

      imagePath = uploadData?.path; // Get the image path after upload
    }

    // Prepare meal data with the image path (if available)
    const mealPayload = {
      ...mealData,
      main_image_url: imagePath || editingMeal?.main_image_url, // Use new or existing image
    };

    if (editingMeal) {
      // Update existing meal
      const { error } = await supabase
        .from('meals')
        .update(mealPayload)
        .eq('id', editingMeal.id);

      if (error) console.error('Error updating meal', error);
    } else {
      // Create new meal
      const { error } = await supabase
        .from('meals')
        .insert([mealPayload]);

      if (error) console.error('Error creating meal', error);
    }

    setEditingMeal(null); // Reset form after submission
    fetchMeals(); // Refresh the list of meals after the update
  };

  // Delete a meal
  const handleDelete = async (mealId: string) => {
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId);

    if (error) console.error('Error deleting meal', error);
    else fetchMeals(); // Refresh the list of meals after deletion
  };

  // Edit a meal
  const handleEdit = (meal: any) => {
    setEditingMeal(meal); // Pre-fill form with the meal data for editing
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin - Manage Meals</h1>

      {/* Meal form for creating or updating a meal */}
      <MealForm initialMeal={editingMeal} onSubmit={handleMealSubmit} />

      <div className="mt-8">
        {meals.map((meal) => (
          <MealCard key={meal.id} meal={meal} onEdit={handleEdit} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
