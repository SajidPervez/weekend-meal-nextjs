'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Meal } from "@/types/meal";
import { supabase } from "@/lib/supabase";
import { AuthError } from '@supabase/supabase-js';

interface BookingFormProps {
  meal: Meal;
}

export default function BookingForm({ meal }: BookingFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pickupTime, setPickupTime] = useState<'12:00' | '18:00'>('12:00');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate quantity
      if (quantity > meal.available_quantity) {
        throw new Error('Selected quantity exceeds available quantity');
      }

      if (quantity < 1) {
        throw new Error('Quantity must be at least 1');
      }

      // Validate contact information
      if (!phone) {
        throw new Error('Phone number is required');
      }

      // Calculate total amount
      const totalAmount = Number((meal.price * quantity).toFixed(2));

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      console.log('Creating order with:', {
        user_id: user?.id || null,
        total_amount: totalAmount,
        customer_email: email || null, // Handle empty email
        customer_phone: phone,
        status: 'pending',
        payment_status: 'pending'
      });

      // Start a Supabase transaction
      const { error: transactionError } = await supabase.rpc('create_order', {
        p_user_id: user?.id || null,
        p_total_amount: totalAmount,
        p_customer_email: email || null,
        p_customer_phone: phone,
        p_meal_id: meal.id,
        p_quantity: quantity,
        p_price: meal.price,
        p_pickup_date: meal.date_available,
        p_pickup_time: pickupTime
      });

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        throw new Error(transactionError.message);
      }

      setSuccess(true);
      
      // Reset form
      setQuantity(1);
      setEmail('');
      setPhone('');
    } catch (error: unknown) {
      console.error('Error in handleSubmit:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while processing your order');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-500 rounded p-4 text-green-700">
        <h3 className="font-bold mb-2">Booking Successful!</h3>
        <p>Thank you for your order. We will contact you shortly with confirmation.</p>
        <Button 
          onClick={() => window.location.href = '/'}
          className="mt-4"
        >
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-500 rounded p-4 text-red-700">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Quantity:
        </label>
        <input 
          type="number" 
          min="1"
          max={meal.available_quantity}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
          required
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Email (optional):
        </label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Phone (required):
        </label>
        <input 
          type="tel" 
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Pickup Time:
        </label>
        <select
          value={pickupTime}
          onChange={(e) => setPickupTime(e.target.value as '12:00' | '18:00')}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          required
        >
          <option value="12:00">Lunch (12:00 PM)</option>
          <option value="18:00">Dinner (6:00 PM)</option>
        </select>
      </div>

      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between mb-4">
          <span>Price per item:</span>
          <span>${meal.price.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-4 text-lg font-bold">
          <span>Total Price:</span>
          <span>${(meal.price * quantity).toFixed(2)}</span>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={loading || meal.available_quantity < 1}
      >
        {loading ? 'Processing...' : meal.available_quantity < 1 ? 'Sold Out' : 'Book Now'}
      </Button>
    </form>
  );
}