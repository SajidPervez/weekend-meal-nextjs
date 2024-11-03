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
  title: string;
  description: string;
  main_image_url: string;
  additional_images: string[];
  price: string;
  available_quantity: string;
  date_available: string;
  time_available: 'lunch' | 'dinner';
  size: string;
  available_for: ('lunch' | 'dinner')[];
  availability_date: string;
  recurring_pattern: {
    type: 'none' | 'weekly' | 'monthly';
    days: string[];
  };
}
