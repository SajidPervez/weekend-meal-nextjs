'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
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
                {/* Booking Form Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-6">Booking Details</h2>
                    <BookingForm meal={meal} />
                </div>
            </div>
        </div>
    );
}
