export interface Meal {
  id: string;
  title: string;
}

export interface OrderItem {
  pickup_date: string;
  pickup_time: string;
  meal_id: string;
  meal?: Meal;
  quantity: number;
}

export interface Order {
  id: number;
  created_at: string;
  status: string;
  total_amount: number;
  customer_email: string;
  customer_phone: string;
  session_id?: string;
  payment_status: string;
  order_items: OrderItem[];
}

export interface OrderItemResponse {
  id: number;
  order_id: number;
  meal_id: string;
  quantity: number;
  price: number;
  pickup_date: string;
  pickup_time: string;
  created_at: string;
}

export interface OrderResponse {
  id: number;
  created_at: string;
  status: string;
  total_amount: number;
  customer_email: string;
  customer_phone: string;
  session_id?: string;
  payment_status: string;
  order_items: OrderItemResponse[];
}
