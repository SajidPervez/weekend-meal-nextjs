'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import type { Meal } from '@/types/meal';
import BookingForm from '@/components/ui/BookingForm';

export default function BookingPage() {
    const params = useParams();
    const [meal, setMeal] = useState<Meal | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMeal = async () => {
            if (params.id) {
                const { data, error } = await supabase
                    .from('meals')
                    .select('*')
                    .eq('id', params.id)
                    .single();

                if (error) {
                    console.error('Error fetching meal:', error);
                    setIsLoading(false);
                    return;
                }

                setMeal(data as Meal);
                setIsLoading(false);
            }
        };

        fetchMeal();
    }, [params.id]);

    if (isLoading) {
        return <div className="container mx-auto px-4 py-8">Loading...</div>;
    }

    if (!meal) {
        return <div className="container mx-auto px-4 py-8">Meal not found</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Booking for {meal.title}</h1>
            
            <div className="grid md:grid-cols-2 gap-8">
                {/* Meal Details Section */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {meal.main_image_url && (
                        <div className="relative w-full h-64">
                            <Image 
                                src={meal.main_image_url}
                                alt={meal.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>
                    )}
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-2">{meal.title}</h2>
                        {meal.description && (
                            <p className="text-gray-600 mb-4">{meal.description}</p>
                        )}
                        <div className="space-y-2">
                            <p className="text-2xl font-bold text-blue-600">${meal.price.toFixed(2)}</p>
                            <p>Available Quantity: {meal.available_quantity}</p>
                            <p>Size: {meal.size}</p>
                            <p>Pick-up Time: {meal.time_available}</p>
                            <p>Date Available: {new Date(meal.date_available).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* Booking Form Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-6">Booking Details</h2>
                    <BookingForm meal={meal} />
                </div>
            </div>
        </div>
    );
}
