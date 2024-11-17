// components/MealForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { MealFormData } from '@/types/meal';
import { Button } from './button';

interface MealFormProps {
  initialMeal: MealFormData | null;
  onSubmit: (data: Partial<MealFormData>, imageFile: File | null) => void;
}

export default function MealForm({ initialMeal, onSubmit }: MealFormProps) {
  const [formData, setFormData] = useState<Partial<MealFormData>>({
    title: '',
    description: '',
    price: '',
    available_quantity: '',
    date_available: '',
    time_available: '',
    size: '',
    available_for: null,
    availability_date: '',
    recurring_pattern: null,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialMeal) {
      setFormData({
        title: initialMeal.title || '',
        description: initialMeal.description || '',
        price: initialMeal.price || '',
        available_quantity: initialMeal.available_quantity || '',
        date_available: initialMeal.date_available || '',
        time_available: initialMeal.time_available || '',
        size: initialMeal.size || '',
        available_for: initialMeal.available_for || null,
        availability_date: initialMeal.availability_date || '',
        recurring_pattern: initialMeal.recurring_pattern || null,
      });
      
      if (initialMeal.main_image_url) {
        setPreviewUrl(initialMeal.main_image_url);
      }
    }
  }, [initialMeal]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, imageFile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Price *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            required
            step="0.01"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="available_quantity" className="block text-sm font-medium text-gray-700">
            Available Quantity *
          </label>
          <input
            type="number"
            id="available_quantity"
            name="available_quantity"
            value={formData.available_quantity}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="date_available" className="block text-sm font-medium text-gray-700">
            Date Available *
          </label>
          <input
            type="date"
            id="date_available"
            name="date_available"
            value={formData.date_available}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="time_available" className="block text-sm font-medium text-gray-700">
            Time Available *
          </label>
          <select
            id="time_available"
            name="time_available"
            value={formData.time_available}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Select time</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
        </div>

        <div>
          <label htmlFor="size" className="block text-sm font-medium text-gray-700">
            Size
          </label>
          <input
            type="text"
            id="size"
            name="size"
            value={formData.size || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">
            Image
          </label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1 block w-full"
          />
          {previewUrl && (
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="mt-2 h-32 w-32 object-cover rounded-md"
            />
          )}
        </div>
      </div>

      <Button type="submit" className="w-full">
        {initialMeal ? 'Update Meal' : 'Create Meal'}
      </Button>
    </form>
  );
}
