'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useCallback } from 'react';
import MealForm from '@/components/ui/MealForm';
import { supabase } from '@/lib/supabase';
import { MealFormData } from '@/types/meal';
import AdminLayout from '@/components/AdminLayout';

function AddMealContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialMeal, setInitialMeal] = useState<MealFormData | null>(null);

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  useEffect(() => {
    checkAuth();
    if (editId) {
      fetchMealData(editId);
    }
  }, [editId, checkAuth]);

  const fetchMealData = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching meal:', error);
        return;
      }

      if (data) {
        // Transform the data to match MealFormData structure
        const formData: MealFormData = {
          id: data.id,
          title: data.title,
          description: data.description,
          main_image_url: data.main_image_url,
          price: data.price,
          available_quantity: data.available_quantity,
          date_available: data.date_available,
          time_available: data.time_available,
          size: data.size,
          available_for: data.available_for?.[0] || null,
          availability_date: data.availability_date,
          recurring_pattern: data.recurring_pattern?.type || null
        };
        setInitialMeal(formData);
      }
    } catch (error) {
      console.error('Error fetching meal data:', error);
    }
  };

  const handleMealSubmit = async (mealData: Partial<MealFormData>, imageFile: File | null) => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('User not authenticated');
        router.push('/login');
        return;
      }

      // Initialize imageUrl with the existing image URL if we're editing
      let imageUrl = editId ? initialMeal?.main_image_url : null;

      if (imageFile) {
        // Upload image to Supabase storage
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `meals/${fileName}`;

        // First, check if the bucket exists
        const { error: bucketError } = await supabase
          .storage
          .getBucket('meal-images');

        // If bucket doesn't exist, create it
        if (bucketError && bucketError.message.includes('not found')) {
          await supabase.storage.createBucket('meal-images', {
            public: true,
            fileSizeLimit: 1024 * 1024 * 2 // 2MB limit
          });
        }

        // If editing and there's an existing image, delete it
        if (editId && initialMeal?.main_image_url) {
          const oldImagePath = initialMeal.main_image_url.split('/').pop();
          if (oldImagePath) {
            await supabase.storage
              .from('meal-images')
              .remove([`meals/${oldImagePath}`]);
          }
        }

        // Upload new image
        const { error: uploadError } = await supabase.storage
          .from('meal-images')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false
          });

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
        main_image_url: imageUrl, // This will now preserve existing image URL if no new image is uploaded
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
        }
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

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">
          {editId ? 'Edit Meal' : 'Add New Meal'}
        </h1>

        <MealForm 
          initialMeal={initialMeal}
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
