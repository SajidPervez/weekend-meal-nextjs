'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import MealForm from '@/components/ui/MealForm';
import { supabase } from '@/lib/supabase';
import { MealFormData } from '@/types/meal';
import AdminLayout from '@/components/AdminLayout';

function AddMealContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

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
        main_image_url: imageUrl || null,
        price: parseFloat(mealData.price?.toString() || '0'),
        available_quantity: parseInt(mealData.available_quantity?.toString() || '0'),
        date_available: new Date(mealData.date_available).toISOString().split('T')[0],
        time_available: mealData.time_available,
        size: mealData.size || null,
        available_for: ['lunch', 'dinner'],
        availability_date: mealData.availability_date 
          ? new Date(mealData.availability_date).toISOString().split('T')[0]
          : null,
        recurring_pattern: {
          type: 'none',
          days: []
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Submitting meal payload:', mealPayload);

      if (editId) {
        const { error: updateError } = await supabase
          .from('meals')
          .update(mealPayload)
          .eq('id', editId);

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

      router.push('/admin');
    } catch (error) {
      console.error('Error handling meal submission:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">
          {editId ? 'Edit Meal' : 'Add New Meal'}
        </h1>

        <MealForm 
          initialMeal={null}
          onSubmit={handleMealSubmit} 
        />
      </div>
    </AdminLayout>
  );
}

export default function AddMeal() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddMealContent />
    </Suspense>
  );
}
