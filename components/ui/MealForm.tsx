// components/MealForm.tsx
import React, { useState } from 'react';

interface MealFormData {
  title: string;
  description: string;
  price: number;
  available_quantity?: number;
  date_available?: string;
  time_available?: 'lunch' | 'dinner';
  size?: string;
}

interface MealFormProps {
  initialMeal?: Partial<MealFormData>;
  onSubmit: (mealData: MealFormData, imageFile: File | null) => void;
}

const MealForm: React.FC<MealFormProps> = ({ initialMeal, onSubmit }) => {
  const [mealData, setMealData] = useState<MealFormData>({
    title: initialMeal?.title || '',
    description: initialMeal?.description || '',
    price: initialMeal?.price || 0,
    available_quantity: initialMeal?.available_quantity,
    date_available: initialMeal?.date_available,
    time_available: initialMeal?.time_available,
    size: initialMeal?.size,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
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
