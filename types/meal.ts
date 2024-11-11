export interface Meal {
  id: string;
  title: string;
  description: string | null;
  main_image_url: string | null;
  additional_images: string[];
  price: number;
  available_quantity: number;
  date_available: string;
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
  main_image_url: string | null;
  price: string | number;
  available_quantity: string | number;
  date_available: string;
  time_available: string;
  size: string | null;
  available_for: string | null;
  availability_date: string | null;
  recurring_pattern: string | null;
}
