import { uuid } from 'uuid';

export interface Meal {
  id: string;
  title: string;
  description: string;
  main_image_url: string | null;
  additional_images?: string[];
  price: number;
  available_quantity: number;
  date_available: string;
  time_available: 'lunch' | 'dinner';
  size: string;
  created_at?: string;
  updated_at?: string;
}

export type MealFormData = {
  title: string;
  description: string;
  main_image_url: string;
  additional_images: string[];
  price: string;
  available_quantity: string;
  date_available: string;
  time_available: 'lunch' | 'dinner';
  size: string;
  available_for: string[];
  availability_date: string;
  recurring_pattern: {
    type: 'none' | 'weekly' | 'specific_day';
    days: string[];
  };
};
