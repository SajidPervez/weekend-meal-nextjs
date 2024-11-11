// components/MealForm.tsx
import React, { useState, useEffect } from 'react';
import { MealFormData } from '@/types/meal';

interface MealFormProps {
  initialMeal?: Partial<MealFormData> | null;
  onSubmit: (mealData: Partial<MealFormData>, imageFile: File | null) => Promise<void>;
}

const MealForm: React.FC<MealFormProps> = ({ initialMeal, onSubmit }) => {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const [mealData, setMealData] = useState<MealFormData>({
    title: initialMeal?.title || '',
    description: initialMeal?.description || '',
    main_image_url: initialMeal?.main_image_url || '',
    price: initialMeal?.price || '',
    available_quantity: initialMeal?.available_quantity || '0',
    // Ensure we always have a valid date
    date_available: initialMeal?.date_available || today,
    time_available: initialMeal?.time_available || 'lunch',
    size: initialMeal?.size || '',
    available_for: initialMeal?.available_for || null,
    availability_date: initialMeal?.availability_date || null,
    recurring_pattern: initialMeal?.recurring_pattern || null,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Update form when initialMeal changes
  useEffect(() => {
    if (initialMeal) {
      setMealData({
        title: initialMeal.title || '',
        description: initialMeal.description || '',
        main_image_url: initialMeal.main_image_url || '',
        price: initialMeal.price || '',
        available_quantity: initialMeal.available_quantity || '0',
        date_available: initialMeal.date_available || today,
        time_available: initialMeal.time_available || 'lunch',
        size: initialMeal.size || '',
        available_for: initialMeal.available_for || null,
        availability_date: initialMeal.availability_date || null,
        recurring_pattern: initialMeal.recurring_pattern || null,
      });
    }
  }, [initialMeal, today]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Special handling for date fields
    if (name === 'date_available' || name === 'availability_date') {
      // Ensure the date is in YYYY-MM-DD format
      const dateValue = value ? new Date(value).toISOString().split('T')[0] : null;
      setMealData(prev => ({ ...prev, [name]: dateValue }));
    } else {
      setMealData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate date before submitting
    if (!mealData.date_available) {
      alert('Please select a valid date');
      return;
    }

    await onSubmit(mealData, imageFile);
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
          value={mealData.description || ''}
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
          value={mealData.time_available}
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
          value={mealData.date_available}
          onChange={handleInputChange}
          className="border p-2 rounded w-full"
          required
          min={today} // Prevent selecting past dates
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
