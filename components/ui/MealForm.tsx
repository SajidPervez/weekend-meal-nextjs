// components/MealForm.tsx
import React, { useState } from 'react';
import { Meal, MealFormData } from '@/types/meal';

interface MealFormProps {
  initialMeal: MealFormData | null;
  onSubmit: (mealData: Partial<MealFormData>, imageFile: File | null) => Promise<void>;
}

const MealForm: React.FC<MealFormProps> = ({ initialMeal, onSubmit }) => {
  const [mealData, setMealData] = useState<MealFormData>({
    title: initialMeal?.title || '',
    description: initialMeal?.description || '',
    main_image_url: initialMeal?.main_image_url || '',
    additional_images: initialMeal?.additional_images || [],
    price: initialMeal?.price || '',
    available_quantity: initialMeal?.available_quantity || '0',
    date_available: initialMeal?.date_available || new Date().toISOString().split('T')[0],
    time_available: initialMeal?.time_available || 'lunch',
    size: initialMeal?.size || '',
    available_for: initialMeal?.available_for || [],
    availability_date: initialMeal?.availability_date || '',
    recurring_pattern: initialMeal?.recurring_pattern || {
      type: 'none',
      days: [],
    },
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'number' ? e.target.value : e.target.value;
    setMealData({ ...mealData, [e.target.name]: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(mealData, imageFile);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="mb-4">
        <label className="block text-gray-700">Title</label>
        <input
          type="text"
          name="title"
          value={mealData.title}
          onChange={handleInputChange}
          className="border p-2 rounded w-full"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Description</label>
        <textarea
          name="description"
          value={mealData.description}
          onChange={handleInputChange}
          className="border p-2 rounded w-full"
          required
        ></textarea>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Price</label>
        <input
          type="number"
          name="price"
          value={mealData.price}
          onChange={handleInputChange}
          className="border p-2 rounded w-full"
          required
          step="0.01"
          min="0"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Available Quantity</label>
        <input
          type="number"
          name="available_quantity"
          value={mealData.available_quantity || ''}
          onChange={handleInputChange}
          className="border p-2 rounded w-full"
          required
          min="0"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Size</label>
        <input
          type="text"
          name="size"
          value={mealData.size || ''}
          onChange={handleInputChange}
          className="border p-2 rounded w-full"
          placeholder="e.g., 500ml"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Time Available</label>
        <select
          name="time_available"
          value={mealData.time_available || 'lunch'}
          onChange={handleInputChange}
          className="border p-2 rounded w-full"
          required
        >
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Date Available</label>
        <input
          type="date"
          name="date_available"
          value={mealData.date_available || ''}
          onChange={handleInputChange}
          className="border p-2 rounded w-full"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="border p-2 rounded w-full"
        />
      </div>
      <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
        Submit
      </button>
    </form>
  );
};

export default MealForm;
