// components/MealForm.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import type { MealFormData } from '@/types/meal';
import { useRouter } from 'next/navigation';
import { MealType } from '@/types/meal';

interface MealFormProps {
  onSubmit: (data: MealFormData) => void;
  initialData?: Partial<MealFormData>;
}

export default function MealForm({ onSubmit, initialData }: MealFormProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>(
    initialData?.image_urls || []
  );
  const [selectedMealTypes, setSelectedMealTypes] = useState<MealType[]>(
    initialData?.meal_types || []
  );
  const [includesGst, setIncludesGst] = useState(initialData?.includes_gst || false);
  const getInitialPrice = () => {
    if (!initialData?.price) return 0;
    return typeof initialData.price === 'string' ? parseFloat(initialData.price) : initialData.price;
  };
  const [basePrice, setBasePrice] = useState<number>(getInitialPrice());
  const [isChefSpecial, setIsChefSpecial] = useState(initialData?.is_chef_special || false);
  const GST_RATE = 0.10; // 10% GST

  const roundToNearestDollar = (price: number) => {
    return Math.ceil(price);
  };

  const calculateFinalPrice = (price: number) => {
    if (!includesGst) {
      return price; // If GST not included, return base price
    }
    // If GST included, add GST amount to base price
    const gstAmount = price * GST_RATE;
    return roundToNearestDollar(price + gstAmount);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBasePrice = parseFloat(e.target.value) || 0;
    setBasePrice(newBasePrice);
  };

  const mealTypes: { value: MealType; label: string; icon: string }[] = [
    { value: 'vegan', label: 'Vegan', icon: '🌱' },
    { value: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
    { value: 'chicken', label: 'Chicken', icon: '🍗' },
    { value: 'lamb', label: 'Lamb', icon: '🐑' },
    { value: 'beef', label: 'Beef', icon: '🥩' },
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + previewUrls.length > 3) {
      alert('Maximum 3 images allowed');
      return;
    }
    
    setImages(prevImages => [...prevImages, ...files]);
    
    // Create preview URLs for new images
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const imageUrls: string[] = [...previewUrls];
      const basePrice = parseFloat(formData.get('price') as string);

      // Upload new images
      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `meal-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('meal-images')
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('meal-images')
          .getPublicUrl(filePath);

        imageUrls.push(publicUrl);
      }

      const finalPrice = calculateFinalPrice(basePrice);

      const mealData: MealFormData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        price: finalPrice,
        includes_gst: includesGst,
        gst_rate: GST_RATE,
        available_quantity: parseInt(formData.get('available_quantity') as string),
        date_available: formData.get('date_available') as string,
        time_available: formData.get('time_available') as string,
        size: formData.get('size') as string,
        meal_types: selectedMealTypes,
        image_urls: imageUrls,
        available_for: null,
        availability_date: null,
        recurring_pattern: null,
        is_chef_special: isChefSpecial,
      };

      await onSubmit(mealData);
    } catch (error) {
      console.error('Error:', error);
      alert('Error uploading images');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <button
          type="button"
          onClick={() => router.push('/admin')}
          className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Back to Dashboard
        </button>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Images (Select up to 3 images)
        </label>
        <p className="text-sm text-gray-500 mb-2">
          Click &quot;Choose File&quot; multiple times or select multiple files at once by holding Ctrl/Cmd while selecting
        </p>
        <div className="mt-1 flex flex-col space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            multiple
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-emerald-50 file:text-emerald-700
              hover:file:bg-emerald-100"
            disabled={previewUrls.length >= 3}
          />
          <div className="flex gap-4 flex-wrap">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-24 h-24 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          name="title"
          defaultValue={initialData?.title}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          defaultValue={initialData?.description ?? ''}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price and GST
        </label>
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          {/* Price Input */}
          <div className="col-span-6 sm:col-span-3">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Base Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="price"
              id="price"
              value={basePrice}
              onChange={handlePriceChange}
              className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              required
            />
          </div>

          {/* GST Checkbox */}
          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="includes-gst"
              checked={includesGst}
              onChange={(e) => setIncludesGst(e.target.checked)}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
            />
            <label htmlFor="includes-gst" className="text-sm text-gray-700">
              Add GST (10%)
            </label>
          </div>

          {/* Final Price Display */}
          <div className="bg-white p-3 rounded-md border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Final Price:</span>
              <span className="text-lg font-semibold text-emerald-600">
                ${calculateFinalPrice(Number(basePrice)).toFixed(2)}
                {includesGst && " (Inc. GST)"}
              </span>
            </div>
            {includesGst && (
              <div className="text-xs text-gray-500 mt-1 flex justify-between">
                <span>Base Price: ${Number(basePrice).toFixed(2)}</span>
                <span>GST (10%): ${(Number(basePrice) * GST_RATE).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Featured Status
        </label>
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h3 className="font-medium text-gray-900">Featured Status</h3>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isChefSpecial"
              checked={isChefSpecial}
              onChange={(e) => setIsChefSpecial(e.target.checked)}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
            />
            <label htmlFor="isChefSpecial" className="text-sm text-gray-600">
              Feature as Chef Special (displays in hero section)
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Available Quantity
          </label>
          <input
            type="number"
            name="available_quantity"
            defaultValue={initialData?.available_quantity}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date Available
          </label>
          <input
            type="date"
            name="date_available"
            defaultValue={initialData?.date_available}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Time Available
          </label>
          <select
            name="time_available"
            defaultValue={initialData?.time_available}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Size
        </label>
        <input
          type="text"
          name="size"
          defaultValue={initialData?.size ?? ''}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Meal Types
          </label>
          <div className="mt-2 space-y-2">
            {mealTypes.map((type) => (
              <label key={type.value} className="inline-flex items-center mr-4">
                <input
                  type="checkbox"
                  checked={selectedMealTypes.includes(type.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMealTypes([...selectedMealTypes, type.value]);
                    } else {
                      setSelectedMealTypes(
                        selectedMealTypes.filter((t) => t !== type.value)
                      );
                    }
                  }}
                  className="form-checkbox h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <span className="ml-2">
                  {type.icon} {type.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={uploading}
        className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Submit'}
      </button>
    </form>
  );
}
