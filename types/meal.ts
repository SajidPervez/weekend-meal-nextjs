export type Meal = {
  id: number;
  title: string;
  description: string;
  price: number;
  date_available: string;
  image_urls: string[];
  available_quantity: number;
  time_available: 'lunch' | 'dinner';
  size: string;
  available_for: ('lunch' | 'dinner')[];
  availability_date: string | null;
  recurring_pattern: {
    type: 'none' | 'weekly' | 'monthly';
    days: string[];
  };
  created_at?: string;
  updated_at?: string;
}

export interface MealFormData {
  id?: string;
  title: string;
  description: string | null;
  image_urls: string[];
  price: string | number;
  available_quantity: string | number;
  date_available: string;
  time_available: string;
  size: string | null;
  available_for: string | null;
  availability_date: string | null;
  recurring_pattern: string | null;
}
