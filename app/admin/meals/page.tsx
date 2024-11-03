'use client';

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import type { Meal, MealFormData } from "@/types/meal";

export default function AdminMeals() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<MealFormData>({
    title: "",
    description: "",
    main_image_url: "",
    additional_images: [],
    price: "",
    available_quantity: "0",
    date_available: getTodayDate(),
    time_available: "lunch",
    size: "500ml",
    available_for: [],
    availability_date: "",
    recurring_pattern: {
      type: "none",
      days: [],
    },
  });

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    const { data, error } = await supabase
      .from('meals')
      .select('*');
    
    if (error) {
      console.error('Error fetching meals:', error);
      return;
    }
    
    setMeals(data || []);
  };

  const handleImageUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('meal-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('meal-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let imageUrl = editingMeal?.main_image_url || '';

      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }

      const mealData = {
        title: formData.title,
        description: formData.description,
        main_image_url: imageUrl,
        additional_images: formData.additional_images,
        price: parseFloat(formData.price),
        available_quantity: parseInt(formData.available_quantity),
        date_available: formData.date_available,
        time_available: formData.time_available,
        size: formData.size,
        available_for: formData.available_for,
        availability_date: formData.availability_date || null,
        recurring_pattern: formData.recurring_pattern
      };

      if (editingMeal) {
        const { error } = await supabase
          .from('meals')
          .update(mealData)
          .eq('id', editingMeal.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('meals')
          .insert([mealData]);

        if (error) throw error;
      }

      await fetchMeals();
      
      setFormData({
        title: "",
        description: "",
        main_image_url: "",
        additional_images: [],
        price: "",
        available_quantity: "0",
        date_available: getTodayDate(),
        time_available: "lunch",
        size: "500ml",
        available_for: [],
        availability_date: "",
        recurring_pattern: {
          type: "none",
          days: [],
        },
      });
      setImageFile(null);
      setEditingMeal(null);
    } catch (error) {
      console.error("Error saving meal:", error);
      alert("Error saving meal. Please check the console for details.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this meal?")) {
      try {
        const { error } = await supabase
          .from('meals')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchMeals();
      } catch (error) {
        console.error("Error deleting meal:", error);
      }
    }
  };

  const handleAvailableForChange = (mealType: 'lunch' | 'dinner', checked: boolean) => {
    const newAvailableFor = checked
      ? [...formData.available_for, mealType]
      : formData.available_for.filter(m => m !== mealType);
    setFormData({...formData, available_for: newAvailableFor});
  };

  const handleSizeChange = (value: string) => {
    if (value === 'small' || value === 'medium' || value === 'large') {
      setFormData({ ...formData, size: value });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Manage Meals</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block">Title:</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="border p-2 w-full"
              required
            />
          </div>

          <div>
            <label className="block">Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="border p-2 w-full"
            />
          </div>

          <div>
            <label className="block">Price:</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="border p-2 w-full"
              required
            />
          </div>

          <div>
            <label className="block">Available Quantity:</label>
            <input
              type="number"
              value={formData.available_quantity}
              onChange={(e) => setFormData({...formData, available_quantity: e.target.value})}
              className="border p-2 w-full"
              required
            />
          </div>

          <div>
            <label className="block">Size:</label>
            <input
              type="text"
              value={formData.size}
              onChange={(e) => setFormData({...formData, size: e.target.value})}
              className="border p-2 w-full"
              placeholder="e.g., 500ml"
            />
          </div>

          <div>
            <label className="block">Time Available:</label>
            <select
              value={formData.time_available}
              onChange={(e) => setFormData({...formData, time_available: e.target.value as 'lunch' | 'dinner'})}
              className="border p-2 w-full"
              required
            >
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
          </div>

          <div>
            <label className="block">Date Available:</label>
            <input
              type="date"
              value={formData.date_available}
              min={getTodayDate()} // Add min attribute to prevent past dates
              onChange={(e) => {
                const selectedDate = e.target.value;
                // Only update if the selected date is today or in the future
                if (selectedDate >= getTodayDate()) {
                  setFormData({...formData, date_available: selectedDate});
                } else {
                  alert("Please select today or a future date");
                  // Reset to today's date if an invalid date was selected
                  setFormData({...formData, date_available: getTodayDate()});
                }
              }}
              className="border p-2 w-full"
              required
            />
          </div>

          <div>
            <label className="block">Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="border p-2 w-full"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {editingMeal ? "Update Meal" : "Add Meal"}
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meals.map((meal) => (
            <div key={meal.id} className="border p-4 rounded">
              <img src={meal.main_image_url || ''} alt={meal.title} className="w-full h-48 object-cover" />
              <h3 className="text-xl font-bold">{meal.title}</h3>
              <p>{meal.description}</p>
              <p className="font-bold">${meal.price}</p>
              <p>Quantity: {meal.available_quantity}</p>
              <p>Size: {meal.size}</p>
              <p>Time Available: {meal.time_available}</p>
              <p>Date Available: {meal.date_available}</p>
              <div className="space-x-2 mt-2">
                <button
                  onClick={() => {
                    setEditingMeal(meal);
                    setFormData({
                      ...meal,
                      price: meal.price.toString(),
                      available_quantity: meal.available_quantity.toString(),
                      description: meal.description || '',
                      additional_images: meal.additional_images || [],
                      available_for: meal.available_for || [],
                      availability_date: meal.availability_date || '',
                      recurring_pattern: meal.recurring_pattern || {
                        type: "none",
                        days: [],
                      },
                    });
                  }}
                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(meal.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
