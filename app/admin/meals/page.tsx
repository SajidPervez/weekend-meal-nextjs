'use client';

import { useState, useEffect } from 'react';
import MealCard from '@/components/ui/MealCard';
import MealForm from '@/components/ui/MealForm';
import { supabase } from '@/lib/supabase';
import { Meal, MealFormData } from '@/types/meal';
import AdminLayout from '@/components/AdminLayout';

interface EditingMeal extends Partial<MealFormData> {
  id?: string;
}

export default function AdminMeals() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [editingMeal, setEditingMeal] = useState<EditingMeal | null>(null);

  useEffect(() => {
    fetchMeals();
  }, []);

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

  const handleMealSubmit = async (mealData: Partial<MealFormData>, imageFile: File | null) => {
    try {
      let imageUrl = null;

      if (imageFile) {
        // Upload image to Supabase storage
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `meals/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('meal-images')
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          return;
        }

        // Get the public URL for the uploaded image
        const { data } = supabase.storage
          .from('meal-images')
          .getPublicUrl(filePath);

        imageUrl = data.publicUrl;
      }

      // Validate required fields
      if (!mealData.title || !mealData.date_available || !mealData.time_available) {
        console.error('Required fields missing');
        return;
      }

      const mealPayload = {
        title: mealData.title,
        description: mealData.description || null,
        main_image_url: imageUrl || editingMeal?.main_image_url || null,
        price: parseFloat(mealData.price?.toString() || '0'),
        available_quantity: parseInt(mealData.available_quantity?.toString() || '0'),
        // Ensure date is in YYYY-MM-DD format
        date_available: new Date(mealData.date_available).toISOString().split('T')[0],
        time_available: mealData.time_available,
        size: mealData.size || null,
        available_for: mealData.available_for ? JSON.parse(mealData.available_for) : ['lunch'],
        // Only include availability_date if it's a valid date
        availability_date: mealData.availability_date 
          ? new Date(mealData.availability_date).toISOString().split('T')[0]
          : null,
        // Parse recurring pattern from string to object
        recurring_pattern: mealData.recurring_pattern 
          ? JSON.parse(mealData.recurring_pattern)
          : { type: 'none', days: [] },
      };

      if (editingMeal?.id) {
        const { error: updateError } = await supabase
          .from('meals')
          .update(mealPayload)
          .eq('id', editingMeal.id);

        if (updateError) {
          console.error('Error updating meal:', updateError);
          return;
        }
      } else {
        const { error: insertError } = await supabase
          .from('meals')
          .insert([mealPayload]);

        if (insertError) {
          console.error('Error creating meal:', insertError);
          return;
        }
      }

      setEditingMeal(null);
      await fetchMeals();
    } catch (error) {
      console.error('Error handling meal submission:', error);
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

  const handleEdit = (meal: Meal) => {
    setEditingMeal({
      id: meal.id,
      title: meal.title,
      description: meal.description,
      main_image_url: meal.main_image_url,
      price: meal.price.toString(),
      available_quantity: meal.available_quantity.toString(),
      date_available: meal.date_available,
      time_available: meal.time_available,
      size: meal.size,
      available_for: JSON.stringify(meal.available_for),
      availability_date: meal.availability_date,
      recurring_pattern: JSON.stringify(meal.recurring_pattern),
    });
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Admin - Manage Meals</h1>

        <MealForm 
          initialMeal={editingMeal}
          onSubmit={handleMealSubmit} 
        />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
