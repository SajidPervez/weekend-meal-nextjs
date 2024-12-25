'use client';

import { useEffect, useRef, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { supabase } from '@/lib/supabase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MealData {
  id: number;
  title: string;
  count: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }[];
}

export const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Popular Meals',
      font: {
        size: 16,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
      },
    },
  },
};

export default function PopularMealsChart() {
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [{
      label: 'Orders completed',
      data: [],
      backgroundColor: '',
      borderColor: '',
      borderWidth: 1
    }]
  });
  const [isLoading, setIsLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First get all completed orders with their order items
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            order_items (
              id,
              meal_id,
              quantity
            )
          `)
          .eq('status', 'completed');

        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
          throw ordersError;
        }

        console.log('Raw orders data:', ordersData);

        // Get unique meal IDs
        const mealIds = new Set(
          ordersData?.flatMap(order => 
            order.order_items.map(item => item.meal_id)
          ) || []
        );

        // Fetch meal details
        const { data: mealsData, error: mealsError } = await supabase
          .from('meals')
          .select('id, title')
          .in('id', Array.from(mealIds));

        if (mealsError) {
          console.error('Error fetching meals:', mealsError);
          throw mealsError;
        }

        // Create a map of meal IDs to titles
        const mealsMap = new Map(
          mealsData?.map(meal => [meal.id, meal.title]) || []
        );

        console.log('Meals map:', mealsMap);

        // Count orders per meal
        const mealCounts: { [key: string]: number } = {};
        ordersData.forEach(order => {
          order.order_items.forEach(item => {
            const mealTitle = mealsMap.get(item.meal_id) || 'Unknown Meal';
            mealCounts[mealTitle] = (mealCounts[mealTitle] || 0) + item.quantity;
          });
        });

        console.log('Meal counts:', mealCounts);

        const sortedMeals = Object.entries(mealCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 4);

        console.log('Sorted meals:', sortedMeals);

        const emeraldColor = 'rgb(52, 211, 153)';

        const chartData = {
          labels: sortedMeals.map(([title]) => title),
          datasets: [
            {
              label: 'Orders',
              data: sortedMeals.map(([, count]) => count),
              backgroundColor: emeraldColor,
              borderColor: emeraldColor,
              borderWidth: 1
            },
          ],
        };

        console.log('Chart data:', chartData);
        setChartData(chartData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.style.height = chartRef.current.offsetWidth > 600 ? '400px' : '300px';
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full" ref={chartRef}>
      <Bar options={options} data={chartData} />
    </div>
  );
}
